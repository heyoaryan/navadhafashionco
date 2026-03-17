-- Fix RLS policies for analytics tables to allow admin access and anonymous inserts

-- Drop existing policies
DROP POLICY IF EXISTS "Allow insert page views" ON page_views;
DROP POLICY IF EXISTS "Allow insert product analytics" ON product_analytics;
DROP POLICY IF EXISTS "Allow insert signup tracking" ON signup_tracking;
DROP POLICY IF EXISTS "Admins can read page views" ON page_views;
DROP POLICY IF EXISTS "Admins can read product analytics" ON product_analytics;
DROP POLICY IF EXISTS "Admins can read signup tracking" ON signup_tracking;

-- Allow INSERT for everyone (authenticated and anonymous)
CREATE POLICY "Allow insert page views" ON page_views
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow insert product analytics" ON product_analytics
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow insert signup tracking" ON signup_tracking
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow SELECT only for admins
CREATE POLICY "Admins can read page views" ON page_views
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can read product analytics" ON product_analytics
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can read signup tracking" ON signup_tracking
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT INSERT ON page_views TO anon;
GRANT INSERT ON page_views TO authenticated;
GRANT SELECT ON page_views TO authenticated;

GRANT INSERT ON product_analytics TO anon;
GRANT INSERT ON product_analytics TO authenticated;
GRANT SELECT ON product_analytics TO authenticated;

GRANT INSERT ON signup_tracking TO authenticated;
GRANT SELECT ON signup_tracking TO authenticated;

-- Ensure the view has proper permissions
DROP VIEW IF EXISTS product_clicks;
CREATE OR REPLACE VIEW product_clicks AS
SELECT * FROM product_analytics WHERE action_type = 'click';

GRANT SELECT ON product_clicks TO authenticated;
