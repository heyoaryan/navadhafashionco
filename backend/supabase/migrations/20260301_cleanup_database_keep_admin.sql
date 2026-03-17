/*
  # Complete Database Cleanup - Delete ALL User Data
  
  This migration cleans up ALL user data including admin accounts:
  - Deletes ALL profiles (cascades to related data)
  - Cleans up ALL orders, cart items, wishlist, addresses, reviews
  - Resets coupon usage
  - Keeps products, categories, and coupons intact
  
  WARNING: This will permanently delete ALL user accounts and data!
  You will need to create a new admin account after running this.
*/

-- Delete all cart items
DELETE FROM cart_items;

-- Delete all carts
DELETE FROM cart;

-- Delete all wishlist items
DELETE FROM wishlist;

-- Delete all addresses
DELETE FROM addresses;

-- Delete all reviews
DELETE FROM reviews;

-- Delete all order items
DELETE FROM order_items;

-- Delete all orders
DELETE FROM orders;

-- Delete ALL profiles (including admin)
-- This will also delete from auth.users due to CASCADE
DELETE FROM profiles;

-- Reset coupon usage counts
UPDATE coupons SET used_count = 0;

-- Log the cleanup
DO $$
BEGIN
  RAISE NOTICE 'Complete database cleanup completed. All user accounts deleted.';
  RAISE NOTICE 'Please create a new admin account.';
END $$;
