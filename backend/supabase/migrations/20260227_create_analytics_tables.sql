-- Create analytics tables for tracking site activity

-- Page views tracking
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_url TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product views/clicks tracking
CREATE TABLE IF NOT EXISTS product_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'click', 'add_to_cart', 'add_to_wishlist')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product_clicks view for easier querying
CREATE OR REPLACE VIEW product_clicks AS
SELECT * FROM product_analytics WHERE action_type = 'click';

-- Create signup_tracking table
CREATE TABLE IF NOT EXISTS signup_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  signup_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User signups tracking (already tracked in profiles, but we'll add a view)
CREATE OR REPLACE VIEW signup_analytics AS
SELECT 
  DATE(created_at) as signup_date,
  COUNT(*) as signup_count
FROM profiles
WHERE role = 'customer'
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_user ON page_views(user_id);

CREATE INDEX IF NOT EXISTS idx_product_analytics_created_at ON product_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_analytics_product ON product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_action ON product_analytics(action_type);

-- RLS Policies
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE signup_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow insert page views" ON page_views;
DROP POLICY IF EXISTS "Allow insert product analytics" ON product_analytics;
DROP POLICY IF EXISTS "Allow insert signup tracking" ON signup_tracking;
DROP POLICY IF EXISTS "Admins can read page views" ON page_views;
DROP POLICY IF EXISTS "Admins can read product analytics" ON product_analytics;
DROP POLICY IF EXISTS "Admins can read signup tracking" ON signup_tracking;

-- Allow insert for all users (tracking)
CREATE POLICY "Allow insert page views" ON page_views
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow insert product analytics" ON product_analytics
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow insert signup tracking" ON signup_tracking
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Only admins can read analytics
CREATE POLICY "Admins can read page views" ON page_views
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can read product analytics" ON product_analytics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can read signup tracking" ON signup_tracking
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Helper function to get unique visitors count
CREATE OR REPLACE FUNCTION get_unique_visitors(days_ago INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT session_id)
    FROM page_views
    WHERE created_at >= NOW() - (days_ago || ' days')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get total page views
CREATE OR REPLACE FUNCTION get_total_page_views(days_ago INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM page_views
    WHERE created_at >= NOW() - (days_ago || ' days')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get top viewed products
CREATE OR REPLACE FUNCTION get_top_viewed_products(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  view_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    COUNT(*) as view_count
  FROM product_analytics pa
  JOIN products p ON pa.product_id = p.id
  WHERE pa.action_type = 'view'
    AND pa.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY p.id, p.name
  ORDER BY view_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
