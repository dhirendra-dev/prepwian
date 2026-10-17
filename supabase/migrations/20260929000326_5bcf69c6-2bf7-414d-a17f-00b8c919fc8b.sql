CREATE OR REPLACE FUNCTION public.can_view_profile_post_file(_viewer_id uuid, _object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.profile_posts p WHERE p.image_url = _object_name)
    OR EXISTS (SELECT 1 FROM public.feed_posts f WHERE f.image_url = _object_name);
$$;

CREATE OR REPLACE FUNCTION public.can_view_feed_story_file(_viewer_id uuid, _object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.feed_stories s WHERE s.image_url = _object_name);
$$;

CREATE OR REPLACE FUNCTION public.can_view_feed_document_file(_viewer_id uuid, _object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.feed_posts f WHERE f.document_url = _object_name);
$$;

REVOKE ALL ON FUNCTION public.can_view_profile_post_file(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_view_feed_story_file(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_view_feed_document_file(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_profile_post_file(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_feed_story_file(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_feed_document_file(uuid, text) TO anon, authenticated;

DROP POLICY IF EXISTS profile_posts_storage_read ON storage.objects;
CREATE POLICY profile_posts_storage_read
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'profile-posts'
  AND (
    owner_id = (SELECT auth.uid()::text)
    OR (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    OR public.can_view_profile_post_file((SELECT auth.uid()), name)
  )
);

DROP POLICY IF EXISTS feed_stories_storage_read ON storage.objects;
CREATE POLICY feed_stories_storage_read
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'feed-stories'
  AND (
    owner_id = (SELECT auth.uid()::text)
    OR (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    OR public.can_view_feed_story_file((SELECT auth.uid()), name)
  )
);

DROP POLICY IF EXISTS feed_documents_storage_read ON storage.objects;
CREATE POLICY feed_documents_storage_read
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'feed-documents'
  AND (
    owner_id = (SELECT auth.uid()::text)
    OR (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    OR public.can_view_feed_document_file((SELECT auth.uid()), name)
  )
);