-- Create screenshots bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Screenshots are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their screenshots" ON storage.objects;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for uploading screenshots
CREATE POLICY "Users can upload screenshots" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'screenshots' AND
  auth.role() = 'authenticated'
);

-- Policy for viewing screenshots (public access)
CREATE POLICY "Screenshots are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'screenshots');

-- Policy for updating screenshots
CREATE POLICY "Users can update their screenshots" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'screenshots' AND
  auth.role() = 'authenticated'
);

-- Policy for deleting screenshots
CREATE POLICY "Users can delete their screenshots" ON storage.objects
FOR DELETE USING (
  bucket_id = 'screenshots' AND
  auth.role() = 'authenticated'
);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
