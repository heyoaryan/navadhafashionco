/*
  # Complete Cleanup - Everything
  
  This migration cleans up EVERYTHING:
  - ALL products and related data
  - ALL analytics data
  - ALL user data
  - ALL coupons
  - ALL orders, cart, wishlist
  - Keeps only structure (tables, functions, policies)
*/

-- Delete all analytics data
DELETE FROM page_views;
DELETE FROM product_views;
DELETE FROM search_queries;

-- Delete all reviews (before products)
DELETE FROM reviews;

-- Delete all order items (before products)
DELETE FROM order_items;

-- Delete all cart items (before products)
DELETE FROM cart_items;

-- Delete all wishlist items (before products)
DELETE FROM wishlist;

-- Delete all products
DELETE FROM products;

-- Delete all orders
DELETE FROM orders;

-- Delete all carts
DELETE FROM cart;

-- Delete all addresses
DELETE FROM addresses;

-- Delete all returns (if exists)
DELETE FROM returns WHERE true;

-- Delete all job applications (if exists)
DELETE FROM job_applications WHERE true;

-- Delete all job positions (if exists)
DELETE FROM job_positions WHERE true;

-- Delete all profiles (including admin)
DELETE FROM profiles;

-- Delete all coupons
DELETE FROM coupons;

-- Delete all blacklist entries (if exists)
DELETE FROM blacklist WHERE true;

-- Log the cleanup
DO $$
BEGIN
  RAISE NOTICE 'Complete cleanup completed:';
  RAISE NOTICE '- All products deleted';
  RAISE NOTICE '- All analytics deleted';
  RAISE NOTICE '- All user data deleted';
  RAISE NOTICE '- All coupons deleted';
  RAISE NOTICE '- All orders/cart/wishlist deleted';
  RAISE NOTICE 'Database is now completely clean!';
END $$;
