-- Run this to fix "new row violates policy" error for storage uploads
-- This removes all existing policies on the book-covers bucket and recreates them

DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public view" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Manage book-covers" ON storage.objects;
DROP POLICY IF EXISTS "View book-covers" ON storage.objects;

-- Allow authenticated users full access to book-covers bucket
CREATE POLICY "Manage book-covers" ON storage.objects
  FOR ALL TO authenticated USING (bucket_id = 'book-covers'::text) WITH CHECK (bucket_id = 'book-covers'::text);

-- Allow public read access to book-covers bucket
CREATE POLICY "View book-covers" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'book-covers'::text);
