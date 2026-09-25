DROP POLICY IF EXISTS "images insert" ON storage.objects;
DROP POLICY IF EXISTS "images delete" ON storage.objects;
CREATE POLICY "images insert authenticated" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images');
CREATE POLICY "images delete owner or admin" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'images' AND (owner_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));