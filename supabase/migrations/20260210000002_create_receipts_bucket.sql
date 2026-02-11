-- Create the 'receipts' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload files to 'receipts'
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Policy: Allow public access to read receipt images (needed for .getPublicUrl())
CREATE POLICY "Public can view receipts"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'receipts' );
