-- 1. chat-media read scoping
DROP POLICY IF EXISTS "chat media read" ON storage.objects;
CREATE POLICY "chat media read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-media'
  AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.chat_messages cm
      WHERE cm.image_url = storage.objects.name
    )
  )
);

-- 2. group_members SELECT scoping
DROP POLICY IF EXISTS "Anyone signed in can view memberships" ON public.group_members;
CREATE POLICY "Members view memberships of their groups" ON public.group_members
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_group_member(group_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id
      AND (COALESCE(g.privacy, 'open'::group_privacy) = 'open'::group_privacy OR g.owner_id = auth.uid())
  )
);

-- 3. test-pdfs policies restricted to authenticated role
DROP POLICY IF EXISTS "test_pdfs_owner_rw" ON storage.objects;
CREATE POLICY "test_pdfs_owner_rw" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'test-pdfs' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'test-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "test_pdfs_admin_all" ON storage.objects;
CREATE POLICY "test_pdfs_admin_all" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'test-pdfs' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'test-pdfs' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Revoke anon EXECUTE on SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.admin_get_consents_decrypted() FROM anon, public;
REVOKE ALL ON FUNCTION public.compute_blue_tick_progress(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.generate_unique_username(text, uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.get_blue_tick_progress(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.get_follow_counts(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.get_login_streak(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.get_my_blue_tick_progress() FROM anon, public;
REVOKE ALL ON FUNCTION public.get_study_streak(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.is_blue_tick_eligible(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.mark_feed_comment_solution(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.public_feed_authors(uuid[]) FROM anon, public;
REVOKE ALL ON FUNCTION public.run_blue_tick_autoverify() FROM anon, public;
REVOKE ALL ON FUNCTION public.award_xp_on_test_completion() FROM anon, public;
REVOKE ALL ON FUNCTION public.award_xp_on_test_insert() FROM anon, public;
REVOKE ALL ON FUNCTION public.block_bot_auto_follow() FROM anon, public;
REVOKE ALL ON FUNCTION public.block_bot_direct_messages() FROM anon, public;
REVOKE ALL ON FUNCTION public.sync_feed_comment_votes_count() FROM anon, public;
REVOKE ALL ON FUNCTION public.sync_feed_post_comments_count() FROM anon, public;
REVOKE ALL ON FUNCTION public.sync_feed_post_votes_count() FROM anon, public;

GRANT EXECUTE ON FUNCTION public.compute_blue_tick_progress(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_blue_tick_progress(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_follow_counts(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_login_streak(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_blue_tick_progress() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_study_streak(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_blue_tick_eligible(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_feed_comment_solution(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_feed_authors(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_consents_decrypted() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_unique_username(text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.run_blue_tick_autoverify() TO service_role;