-- Public read for feed-related media buckets (feed content is already public)
DROP POLICY IF EXISTS "feed_stories_storage_read" ON storage.objects;
CREATE POLICY "feed_stories_storage_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'feed-stories');

DROP POLICY IF EXISTS "feed_documents_storage_read" ON storage.objects;
CREATE POLICY "feed_documents_storage_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'feed-documents');

DROP POLICY IF EXISTS "profile_posts_storage_public_read" ON storage.objects;
CREATE POLICY "profile_posts_storage_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'profile-posts');

-- Private chat media: signed-in, non-anonymous users only
DROP POLICY IF EXISTS "chat media read" ON storage.objects;
CREATE POLICY "chat media read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );
