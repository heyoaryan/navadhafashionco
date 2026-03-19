-- Performance optimization: Add missing indexes to reduce query load
-- These indexes directly address the Supabase "Unhealthy" resource exhaustion

-- Products: most queried filters
CREATE INDEX IF NOT EXISTS idx_products_is_active_created ON products(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_is_active_gender ON products(is_active, gender);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category_id, is_active);

-- Cart: user lookup
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);

-- Wishlist: user lookup
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);

-- Orders: user + status filters
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

-- Order items: product sales aggregation
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Returns: user lookup
CREATE INDEX IF NOT EXISTS idx_returns_user_id ON returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_user_type ON returns(user_id, return_type);

-- Reviews: product lookup
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id, created_at DESC);

-- Blacklist: entity lookup
CREATE INDEX IF NOT EXISTS idx_blacklist_entity ON blacklist(entity_id, entity_type, is_active);

-- Profiles: role filter
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Product images: product lookup
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id, display_order);

-- Product interest: product + user
CREATE INDEX IF NOT EXISTS idx_product_interest_product_id ON product_interest(product_id);
