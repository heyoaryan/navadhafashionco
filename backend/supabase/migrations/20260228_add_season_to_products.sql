-- Add season column to products table for seasonal collections
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS season TEXT CHECK (season IN ('summer', 'winter', 'all-season'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_season ON products(season);
CREATE INDEX IF NOT EXISTS idx_products_gender_season ON products(gender, season);

-- Update existing products to have 'all-season' as default
UPDATE products 
SET season = 'all-season' 
WHERE season IS NULL;

-- Add comment
COMMENT ON COLUMN products.season IS 'Seasonal category: summer (Feb 15 - Oct 4), winter (Oct 5 - Feb 14), or all-season';
