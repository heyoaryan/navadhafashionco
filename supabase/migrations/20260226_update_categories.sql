-- Update products table to support new categories
-- Add check constraint for valid categories and subcategories

-- First, drop existing constraint if any
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;

-- Add new constraint with all categories
ALTER TABLE products ADD CONSTRAINT products_category_check 
CHECK (category IN ('western', 'indo-western', 'ethnic', 'work', 'occasional', 'boutique'));

-- Update existing products if needed (optional - only if you have old data)
-- UPDATE products SET category = 'western' WHERE category = 'casual';

-- Add comment to category column
COMMENT ON COLUMN products.category IS 'Product category: western, indo-western, ethnic, work, occasional, boutique';

-- Add comment to subcategory column
COMMENT ON COLUMN products.subcategory IS 'Product subcategory based on main category';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);
CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);
