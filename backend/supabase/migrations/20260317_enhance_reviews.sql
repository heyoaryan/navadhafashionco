-- Add media support to reviews and fix verified purchase logic

-- Add media_urls column to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT '{}';

-- Drop old insert policy and recreate with verified purchase check
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;

-- Users can only review products they have delivered orders for
CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.user_id = auth.uid()
        AND oi.product_id = reviews.product_id
        AND o.status = 'delivered'
    )
  );

-- Function to auto-set is_verified_purchase on insert
CREATE OR REPLACE FUNCTION set_verified_purchase()
RETURNS TRIGGER AS $$
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.user_id = NEW.user_id
      AND oi.product_id = NEW.product_id
      AND o.status = 'delivered'
  ) INTO NEW.is_verified_purchase;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_verified_purchase ON reviews;
CREATE TRIGGER trg_set_verified_purchase
  BEFORE INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_verified_purchase();

-- Storage bucket for review media
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-media', 'review-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload review media
DROP POLICY IF EXISTS "Users can upload review media" ON storage.objects;
CREATE POLICY "Users can upload review media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'review-media');

DROP POLICY IF EXISTS "Anyone can view review media" ON storage.objects;
CREATE POLICY "Anyone can view review media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'review-media');
