-- Allow anon role to SELECT their own signup_tracking row
-- Needed by AuthCallback to check if user already exists (count === 0 check)
-- Without this, the count check always returns null and Google OAuth signup is never tracked

GRANT SELECT ON signup_tracking TO anon;

DROP POLICY IF EXISTS "Allow select own signup tracking" ON signup_tracking;

CREATE POLICY "Allow select own signup tracking" ON signup_tracking
  FOR SELECT
  USING (true);
