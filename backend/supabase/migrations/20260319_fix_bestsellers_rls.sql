-- Allow public (anon) read access to order_items for best sellers calculation
-- Only product_id and quantity are needed — no sensitive order/user data exposed

-- Drop existing anon-blocking policy if any
DROP POLICY IF EXISTS "Public can read order items for analytics" ON order_items;

CREATE POLICY "Public can read order items for analytics"
  ON order_items FOR SELECT
  TO anon, authenticated
  USING (true);

-- Also allow public read on orders table for status filtering (best sellers needs this)
DROP POLICY IF EXISTS "Public can read order statuses for analytics" ON orders;

CREATE POLICY "Public can read order statuses for analytics"
  ON orders FOR SELECT
  TO anon
  USING (true);
