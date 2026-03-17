-- Fix return_type default: should be 'exchange' not 'refund'
-- First return is always exchange, second is refund
ALTER TABLE returns ALTER COLUMN return_type SET DEFAULT 'exchange';

-- Fix existing returns that have return_type = 'refund' but are actually first returns
-- (i.e., no previous_return_id and no other return exists for same order before them)
UPDATE returns r
SET return_type = 'exchange'
WHERE r.return_type = 'refund'
  AND r.previous_return_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM returns r2
    WHERE r2.order_id = r.order_id
      AND r2.id != r.id
      AND r2.created_at < r.created_at
  );

-- Also ensure RLS allows users to SELECT their own returns properly
-- Drop and recreate to be safe
DROP POLICY IF EXISTS "Users can view own returns" ON returns;
DROP POLICY IF EXISTS "Users can create returns" ON returns;
DROP POLICY IF EXISTS "Admins can view all returns" ON returns;
DROP POLICY IF EXISTS "Admins can update returns" ON returns;

CREATE POLICY "Users can view own returns"
  ON returns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create returns"
  ON returns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all returns"
  ON returns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update returns"
  ON returns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
