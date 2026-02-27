-- Performance Optimization Migration
-- Fixes slow queries and adds missing indexes

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING gin(tags);

-- Optimize cart queries
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);

-- Optimize order queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Optimize wishlist queries
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON wishlist(product_id);

-- Optimize address queries
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_default ON addresses(is_default) WHERE is_default = true;

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_product ON cart_items(cart_id, product_id);

-- Optimize product images
CREATE INDEX IF NOT EXISTS idx_product_images_product_order ON product_images(product_id, display_order);

-- Add statistics for better query planning
ANALYZE products;
ANALYZE cart;
ANALYZE cart_items;
ANALYZE orders;
ANALYZE order_items;
ANALYZE wishlist;
ANALYZE addresses;
