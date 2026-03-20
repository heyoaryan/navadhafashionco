-- Fix product_images 500 errors
-- Drop and recreate all RLS policies on product_images to resolve server errors

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view product images" ON product_images;
DROP POLICY IF EXISTS "Admins can manage product images" ON product_images;

-- Re-enable RLS (in case it was disabled)
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon + authenticated) to read product images
CREATE POLICY "Anyone can view product images"
  ON product_images FOR SELECT
  USING (true);

-- Admins can insert/update/delete product images
CREATE POLICY "Admins can insert product images"
  ON product_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update product images"
  ON product_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete product images"
  ON product_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
