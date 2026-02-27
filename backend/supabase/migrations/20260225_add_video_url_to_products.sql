-- Add video_url field to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url text;

COMMENT ON COLUMN products.video_url IS 'URL for product video (YouTube, Vimeo, or direct video link)';
