CREATE POLICY "images read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'images');
CREATE POLICY "images insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'images');
CREATE POLICY "images delete" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'images');