-- Fix signup tracking: ensure ALL new signups (email + Google) are automatically recorded
-- Root cause: client-side trackSignup() was failing because:
--   1. RLS policy only allowed 'authenticated' role, but new users aren't authenticated yet
--   2. Race condition: session not fully established when trackSignup() fires
-- Solution: DB trigger on auth.users INSERT — 100% reliable, no client-side dependency

-- ── 1. Fix RLS: allow anon inserts into signup_tracking ──────────────────────
DROP POLICY IF EXISTS "Allow insert signup tracking" ON signup_tracking;

CREATE POLICY "Allow insert signup tracking" ON signup_tracking
  FOR INSERT
  WITH CHECK (true);

GRANT INSERT ON signup_tracking TO anon;
GRANT INSERT ON signup_tracking TO authenticated;

-- ── 2. DB trigger: auto-insert into signup_tracking on every new auth.users row ─
CREATE OR REPLACE FUNCTION public.handle_new_user_signup_tracking()
RETURNS trigger AS $$
DECLARE
  v_method TEXT;
BEGIN
  -- Detect signup method from app_metadata provider
  v_method := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    'email'
  );

  -- Only insert if not already tracked (idempotent)
  INSERT INTO public.signup_tracking (user_id, session_id, signup_method, created_at)
  VALUES (
    NEW.id,
    'server_trigger',   -- no browser session available server-side
    v_method,
    NEW.created_at
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created_track_signup ON auth.users;

CREATE TRIGGER on_auth_user_created_track_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup_tracking();

-- ── 3. Backfill: add missing signups from profiles table ─────────────────────
-- For users who signed up before this fix, backfill from profiles
INSERT INTO public.signup_tracking (user_id, session_id, signup_method, created_at)
SELECT
  p.id,
  'backfill',
  COALESCE(
    (SELECT raw_app_meta_data->>'provider' FROM auth.users WHERE id = p.id),
    'email'
  ),
  p.created_at
FROM public.profiles p
WHERE p.role = 'customer'
  AND NOT EXISTS (
    SELECT 1 FROM public.signup_tracking st WHERE st.user_id = p.id
  )
ON CONFLICT DO NOTHING;
