
CREATE POLICY "profile_posts_storage_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'profile-posts');

CREATE POLICY "profile_posts_storage_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-posts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "profile_posts_storage_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-posts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "profile_posts_storage_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'profile-posts' AND (storage.foldername(name))[1] = auth.uid()::text);
