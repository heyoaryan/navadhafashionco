-- Create storage bucket for return images
INSERT INTO storage.buckets (id, name, public)
VALUES ('returns', 'returns', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for returns bucket
CREATE POLICY "Anyone can view return images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'returns');

CREATE POLICY "Authenticated users can upload return images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'returns');

CREATE POLICY "Users can update own return images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'returns' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own return images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'returns' AND auth.uid()::text = (storage.foldername(name))[1]);
