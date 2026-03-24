-- Fix signup_tracking RLS: allow anon inserts
-- When a user signs up, they are NOT yet authenticated at the moment trackSignup() fires.
-- The previous policy only allowed `authenticated` role, so all signup inserts were silently blocked.

DROP POLICY IF EXISTS "Allow insert signup tracking" ON signup_tracking;

CREATE POLICY "Allow insert signup tracking" ON signup_tracking
  FOR INSERT
  WITH CHECK (true);

-- Also grant INSERT to anon role
GRANT INSERT ON signup_tracking TO anon;
