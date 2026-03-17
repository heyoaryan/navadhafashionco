-- Disable email confirmation for easier signup
-- This allows users to sign up and login immediately without email verification

-- Note: This is recommended for development
-- For production, you should enable email confirmation with proper SMTP setup

-- Disable email confirmation requirement
ALTER TABLE auth.users ALTER COLUMN email_confirmed_at SET DEFAULT now();

-- Auto-confirm existing unconfirmed users (optional)
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email_confirmed_at IS NULL;

-- Add comment
COMMENT ON COLUMN auth.users.email_confirmed_at IS 'Auto-set to now() to bypass email confirmation';
