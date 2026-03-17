-- Fix order number generation to prevent duplicates
-- Create a sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1;

-- Create a function to generate unique order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  next_num bigint;
  order_num text;
BEGIN
  -- Get next sequence value
  next_num := nextval('order_number_seq');
  
  -- Format as N followed by zero-padded number (minimum 2 digits)
  order_num := 'N' || LPAD(next_num::text, 2, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Set the sequence to start from the current max order number + 1
DO $$
DECLARE
  max_order_num text;
  max_num integer;
BEGIN
  -- Get the highest order number
  SELECT order_number INTO max_order_num
  FROM orders
  WHERE order_number ~ '^N[0-9]+$'
  ORDER BY CAST(SUBSTRING(order_number FROM 2) AS INTEGER) DESC
  LIMIT 1;
  
  -- If there are existing orders, set sequence to max + 1
  IF max_order_num IS NOT NULL THEN
    max_num := CAST(SUBSTRING(max_order_num FROM 2) AS INTEGER);
    PERFORM setval('order_number_seq', max_num);
  END IF;
END $$;

-- Add a default value to order_number column using the function
ALTER TABLE orders 
  ALTER COLUMN order_number SET DEFAULT generate_order_number();

-- Add comment for documentation
COMMENT ON FUNCTION generate_order_number() IS 'Generates unique order numbers in format N01, N02, etc. using a sequence to prevent duplicates';
