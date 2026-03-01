/*
  # Restrict Admin from Placing Orders
  
  This migration adds a trigger to prevent admin users from placing orders.
  Admins should only manage the store, not place orders as customers.
*/

-- Create a function to validate order creation
CREATE OR REPLACE FUNCTION check_admin_order()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get user role
  SELECT role INTO user_role
  FROM profiles 
  WHERE id = NEW.user_id;
  
  -- Check if user is admin
  IF user_role = 'admin' THEN
    RAISE EXCEPTION 'Admin accounts cannot place orders. Please use a customer account.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check before insert
DROP TRIGGER IF EXISTS prevent_admin_orders ON orders;
CREATE TRIGGER prevent_admin_orders
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION check_admin_order();

-- Add comment
COMMENT ON FUNCTION check_admin_order() IS 
'Validates that admin users cannot create orders. Triggers before order insert.';
