-- Add sale_price column to products table if it doesn't exist
-- This column was referenced in frontend code but missing from schema

ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price decimal(10,2) DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN products.sale_price IS 'Optional sale/discounted price. If set, shown instead of price.';
