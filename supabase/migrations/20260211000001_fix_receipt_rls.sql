-- Drop the restrictive policy that requires auth.uid()
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;

-- Create a permissive policy for the backend (running as anon) to upload
-- Note: Security is enforced by the Backend API layer which validates the user before uploading.
CREATE POLICY "Allow public uploads to receipts"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'receipts' );
