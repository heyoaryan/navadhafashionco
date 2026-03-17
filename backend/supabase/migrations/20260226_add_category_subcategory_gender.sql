-- Add category, subcategory, and gender columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);
CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);
CREATE INDEX IF NOT EXISTS idx_products_category_gender ON products(category, gender);
CREATE INDEX IF NOT EXISTS idx_products_category_subcategory ON products(category, subcategory);

-- Add comments for documentation
COMMENT ON COLUMN products.category IS 'Main category: western, indo-western, ethnic, work, occasional';
COMMENT ON COLUMN products.subcategory IS 'Subcategory based on main category';
COMMENT ON COLUMN products.gender IS 'Target gender: women, men, unisex';
