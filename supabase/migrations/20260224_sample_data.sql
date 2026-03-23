-- Insert sample categories
INSERT INTO categories (name, slug, description, is_active, display_order) VALUES
('New Arrivals', 'new-arrivals', 'Latest fashion trends', true, 1),
('Women', 'women', 'Women''s collection', true, 2),
('Boutique', 'boutique', 'Exclusive boutique collection', true, 3);

-- Insert boutique subcategories
INSERT INTO categories (name, slug, description, parent_id, is_active, display_order)
SELECT 'Ready Made', 'ready-made', 'Ready to wear collection', id, true, 1
FROM categories WHERE slug = 'boutique';

INSERT INTO categories (name, slug, description, parent_id, is_active, display_order)
SELECT 'Customization', 'customization', 'Custom tailored pieces', id, true, 2
FROM categories WHERE slug = 'boutique';

-- Insert sample products
INSERT INTO products (name, slug, description, price, compare_at_price, stock_quantity, sizes, colors, main_image_url, is_featured, is_active, category_id, tags)
SELECT 
  'Elegant Silk Saree',
  'elegant-silk-saree',
  'Beautiful handwoven silk saree with intricate designs',
  4999.00,
  6999.00,
  15,
  ARRAY['Free Size'],
  '[{"name": "Red", "hex": "#DC2626"}, {"name": "Blue", "hex": "#2563EB"}]'::jsonb,
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
  true,
  true,
  id,
  ARRAY['saree', 'silk', 'traditional']
FROM categories WHERE slug = 'new-arrivals' LIMIT 1;

INSERT INTO products (name, slug, description, price, stock_quantity, sizes, colors, main_image_url, is_featured, is_active, category_id, tags)
SELECT 
  'Designer Kurti Set',
  'designer-kurti-set',
  'Stylish kurti with palazzo pants',
  2499.00,
  20,
  ARRAY['S', 'M', 'L', 'XL'],
  '[{"name": "Pink", "hex": "#EC4899"}, {"name": "White", "hex": "#FFFFFF"}]'::jsonb,
  'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800',
  true,
  true,
  id,
  ARRAY['kurti', 'ethnic', 'casual']
FROM categories WHERE slug = 'women' LIMIT 1;

INSERT INTO products (name, slug, description, price, compare_at_price, stock_quantity, sizes, colors, main_image_url, is_active, category_id, tags)
SELECT 
  'Embroidered Lehenga',
  'embroidered-lehenga',
  'Stunning bridal lehenga with heavy embroidery',
  15999.00,
  19999.00,
  5,
  ARRAY['S', 'M', 'L'],
  '[{"name": "Maroon", "hex": "#7F1D1D"}, {"name": "Gold", "hex": "#F59E0B"}]'::jsonb,
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
  true,
  id,
  ARRAY['lehenga', 'bridal', 'wedding']
FROM categories WHERE slug = 'ready-made' LIMIT 1;

INSERT INTO products (name, slug, description, price, stock_quantity, sizes, main_image_url, is_active, category_id, tags)
SELECT 
  'Anarkali Suit',
  'anarkali-suit',
  'Graceful anarkali suit for special occasions',
  3999.00,
  12,
  ARRAY['S', 'M', 'L', 'XL'],
  '[{"name": "Green", "hex": "#059669"}, {"name": "Purple", "hex": "#7C3AED"}]'::jsonb,
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
  true,
  id,
  ARRAY['anarkali', 'suit', 'party-wear']
FROM categories WHERE slug = 'women' LIMIT 1;

INSERT INTO products (name, slug, description, price, stock_quantity, sizes, main_image_url, is_active, category_id, tags)
SELECT 
  'Cotton Salwar Kameez',
  'cotton-salwar-kameez',
  'Comfortable daily wear salwar suit',
  1499.00,
  25,
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  '[{"name": "Yellow", "hex": "#EAB308"}, {"name": "Orange", "hex": "#F97316"}]'::jsonb,
  'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800',
  true,
  id,
  ARRAY['salwar', 'cotton', 'daily-wear']
FROM categories WHERE slug = 'women' LIMIT 1;
