-- Final performance optimization for production scale

-- 1. Statement timeouts — prevent runaway queries from killing the DB
ALTER ROLE authenticator SET statement_timeout = '8s';
ALTER ROLE anon SET statement_timeout = '6s';

-- 2. Connection limit per role — prevent pool exhaustion
ALTER ROLE anon CONNECTION LIMIT 50;
ALTER ROLE authenticated CONNECTION LIMIT 100;

-- 3. Critical missing indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_product ON product_analytics(product_id, action_type);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_products_active_created ON products(is_active, created_at DESC) WHERE is_active = true;

-- 4. Refresh query planner stats
ANALYZE products;
ANALYZE orders;
ANALYZE order_items;
ANALYZE returns;
ANALYZE profiles;
ANALYZE product_images;
