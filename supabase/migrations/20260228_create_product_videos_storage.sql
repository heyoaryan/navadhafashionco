-- Create storage bucket for product videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-videos',
  'product-videos',
  true,
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for product-videos bucket
CREATE POLICY "Admins can upload product videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-videos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Anyone can view product videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-videos');

CREATE POLICY "Admins can update product videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-videos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete product videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-videos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
