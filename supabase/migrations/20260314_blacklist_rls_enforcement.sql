-- REVERT: Remove blacklist check from profiles SELECT policy
-- Profiles RLS should NOT block based on is_blacklisted
-- Blacklist enforcement is handled at application level via blacklist table
-- This prevents admin login issues

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin'));

-- Allow authenticated users to read their own blacklist entry
-- (needed so frontend can detect if they are blacklisted)
DROP POLICY IF EXISTS "Users can check own blacklist status" ON blacklist;

CREATE POLICY "Users can check own blacklist status"
  ON blacklist FOR SELECT TO authenticated
  USING (entity_id = auth.uid());
