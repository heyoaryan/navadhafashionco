-- Allow users to cancel their own orders (only when status is 'processing')
DROP POLICY IF EXISTS "Users can cancel own orders" ON orders;

CREATE POLICY "Users can cancel own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'processing')
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');
