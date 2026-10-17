-- Certificate catalogue: only complete, published catalogue rows
DROP POLICY IF EXISTS "Anyone can view certificate types" ON public.certificate_types;
CREATE POLICY "Published certificate types are readable"
ON public.certificate_types FOR SELECT
TO anon, authenticated
USING (code IS NOT NULL AND name IS NOT NULL AND sort_order IS NOT NULL);

-- Polls: current polls only, plus creator/admin
DROP POLICY IF EXISTS "polls readable by all" ON public.polls;
CREATE POLICY "Current polls are readable"
ON public.polls FOR SELECT
TO anon, authenticated
USING (
  created_by = auth.uid()
  OR public.is_admin_user(auth.uid())
  OR closes_at IS NULL
  OR closes_at > (now() - interval '30 days')
);

-- Toppers: recent, named showcase entries only, plus creator/admin
DROP POLICY IF EXISTS "Toppers are viewable by everyone" ON public.toppers;
CREATE POLICY "Recent toppers are readable"
ON public.toppers FOR SELECT
TO anon, authenticated
USING (
  created_by = auth.uid()
  OR public.is_admin_user(auth.uid())
  OR (name IS NOT NULL AND year >= (EXTRACT(year FROM now())::int - 6))
);

-- Avatars: uploader, or an image actually used as someone's profile picture
DROP POLICY IF EXISTS "Avatars are readable by authenticated users" ON storage.objects;
CREATE POLICY "Avatars are readable by owner or when in use"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  AND (
    owner_id = (auth.uid())::text
    OR (storage.foldername(name))[1] = (auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.avatar_url = objects.name OR p.avatar_url LIKE ('%' || objects.name)
    )
  )
);

-- Chat media: uploader, admin, or a live message from an account in good standing
DROP POLICY IF EXISTS "chat media read" ON storage.objects;
CREATE POLICY "chat media read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-media'
  AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  AND auth.uid() IS NOT NULL
  AND (
    owner_id = (auth.uid())::text
    OR (storage.foldername(name))[1] = (auth.uid())::text
    OR public.is_admin_user(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.chat_messages cm
      WHERE cm.image_url = objects.name
        AND cm.deleted_at IS NULL
        AND COALESCE(cm.deleted_for_everyone, false) = false
        AND public.is_user_active(cm.user_id)
    )
  )
);