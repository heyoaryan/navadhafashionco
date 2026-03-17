-- Reviews are auto-approved on insert, no admin approval needed

-- Allow anyone (including anon) to view all reviews (not just approved ones)
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON reviews;
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated, anon
  USING (true);
