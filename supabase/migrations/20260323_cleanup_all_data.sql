-- ============================================
-- FULL CLEANUP: Delete all data, reset order counter to N1
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Analytics tables
TRUNCATE TABLE page_views RESTART IDENTITY CASCADE;
TRUNCATE TABLE product_analytics RESTART IDENTITY CASCADE;
TRUNCATE TABLE signup_tracking RESTART IDENTITY CASCADE;

-- 2. Returns
TRUNCATE TABLE returns RESTART IDENTITY CASCADE;

-- 3. Order items & orders
TRUNCATE TABLE order_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE orders RESTART IDENTITY CASCADE;

-- 4. Cart
TRUNCATE TABLE cart_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE cart RESTART IDENTITY CASCADE;

-- 5. Wishlist
TRUNCATE TABLE wishlist RESTART IDENTITY CASCADE;

-- 6. Reviews
TRUNCATE TABLE reviews RESTART IDENTITY CASCADE;

-- 7. Addresses
TRUNCATE TABLE addresses RESTART IDENTITY CASCADE;

-- 8. Blacklist
TRUNCATE TABLE blacklist RESTART IDENTITY CASCADE;

-- 9. Job applications & positions
TRUNCATE TABLE job_applications RESTART IDENTITY CASCADE;
TRUNCATE TABLE job_positions RESTART IDENTITY CASCADE;

-- 10. Coupons
TRUNCATE TABLE coupons RESTART IDENTITY CASCADE;

-- 11. Products & images
TRUNCATE TABLE product_images RESTART IDENTITY CASCADE;
TRUNCATE TABLE products RESTART IDENTITY CASCADE;

-- 12. Categories
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;

-- 13. Reset order number sequence so next order = N1
ALTER SEQUENCE order_number_seq RESTART WITH 1;

-- 14. Delete ALL profiles
TRUNCATE TABLE profiles RESTART IDENTITY CASCADE;

-- 15. Delete ALL auth users
DELETE FROM auth.users;

-- Verify
SELECT 'orders' as table_name, COUNT(*) as count FROM orders
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL SELECT 'categories', COUNT(*) FROM categories;
