GRANT EXECUTE ON FUNCTION public.is_user_active(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO anon, authenticated;

-- chat messages: author must be in good standing (or self / admin)
DROP POLICY IF EXISTS "chat members read" ON public.chat_messages;
CREATE POLICY "chat members read" ON public.chat_messages FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin_user(auth.uid()) OR (user_id IS NOT NULL AND public.is_user_active(user_id)));

DROP POLICY IF EXISTS "Reactions are viewable by authenticated users" ON public.chat_message_reactions;
CREATE POLICY "Reactions are viewable by authenticated users" ON public.chat_message_reactions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_user_active(user_id));

-- profile posts and their engagement
DROP POLICY IF EXISTS "profile_posts_select_all" ON public.profile_posts;
CREATE POLICY "profile_posts_select_all" ON public.profile_posts FOR SELECT TO anon, authenticated
USING (user_id = auth.uid() OR public.is_user_active(user_id));

DROP POLICY IF EXISTS "ppc_select_all" ON public.profile_post_comments;
CREATE POLICY "ppc_select_all" ON public.profile_post_comments FOR SELECT TO anon, authenticated
USING (user_id = auth.uid() OR public.is_user_active(user_id));

DROP POLICY IF EXISTS "ppl_select_all" ON public.profile_post_likes;
CREATE POLICY "ppl_select_all" ON public.profile_post_likes FOR SELECT TO anon, authenticated
USING (user_id = auth.uid() OR public.is_user_active(user_id));

-- feed
DROP POLICY IF EXISTS "feed_posts public read" ON public.feed_posts;
CREATE POLICY "feed_posts public read" ON public.feed_posts FOR SELECT TO anon, authenticated
USING (user_id = auth.uid() OR public.is_user_active(user_id));

DROP POLICY IF EXISTS "feed_comments public read" ON public.feed_comments;
CREATE POLICY "feed_comments public read" ON public.feed_comments FOR SELECT TO anon, authenticated
USING (user_id = auth.uid() OR public.is_user_active(user_id));

DROP POLICY IF EXISTS "feed_likes public read" ON public.feed_likes;
CREATE POLICY "feed_likes public read" ON public.feed_likes FOR SELECT TO anon, authenticated
USING (user_id = auth.uid() OR public.is_user_active(user_id));

DROP POLICY IF EXISTS "feed_post_votes public read" ON public.feed_post_votes;
CREATE POLICY "feed_post_votes public read" ON public.feed_post_votes FOR SELECT TO anon, authenticated
USING (user_id = auth.uid() OR public.is_user_active(user_id));

DROP POLICY IF EXISTS "feed_comment_votes public read" ON public.feed_comment_votes;
CREATE POLICY "feed_comment_votes public read" ON public.feed_comment_votes FOR SELECT TO anon, authenticated
USING (user_id = auth.uid() OR public.is_user_active(user_id));

-- forum
DROP POLICY IF EXISTS "Anyone signed in can view threads" ON public.forum_threads;
CREATE POLICY "Anyone signed in can view threads" ON public.forum_threads FOR SELECT TO anon, authenticated
USING (user_id = auth.uid() OR public.is_user_active(user_id));

DROP POLICY IF EXISTS "Anyone signed in can view replies" ON public.forum_replies;
CREATE POLICY "Anyone signed in can view replies" ON public.forum_replies FOR SELECT TO anon, authenticated
USING (user_id = auth.uid() OR public.is_user_active(user_id));

-- videos
DROP POLICY IF EXISTS "video_comments_select_all" ON public.video_comments;
CREATE POLICY "video_comments_select_all" ON public.video_comments FOR SELECT TO anon, authenticated
USING (user_id = auth.uid() OR public.is_user_active(user_id));

DROP POLICY IF EXISTS "video_likes_select_all" ON public.video_likes;
CREATE POLICY "video_likes_select_all" ON public.video_likes FOR SELECT TO anon, authenticated
USING (user_id = auth.uid() OR public.is_user_active(user_id));

-- social graph and stats
DROP POLICY IF EXISTS "Anyone can view follow relationships" ON public.follows;
CREATE POLICY "Anyone can view follow relationships" ON public.follows FOR SELECT TO anon, authenticated
USING (follower_id = auth.uid() OR following_id = auth.uid() OR (public.is_user_active(follower_id) AND public.is_user_active(following_id)));

DROP POLICY IF EXISTS "XP totals are public" ON public.user_xp;
CREATE POLICY "XP totals are public" ON public.user_xp FOR SELECT TO anon, authenticated
USING (user_id = auth.uid() OR public.is_user_active(user_id));

DROP POLICY IF EXISTS "Weekly leaderboard totals are public" ON public.leaderboard_weekly_totals;
CREATE POLICY "Weekly leaderboard totals are public" ON public.leaderboard_weekly_totals FOR SELECT TO anon, authenticated
USING (user_id = auth.uid() OR public.is_user_active(user_id));

-- communities and group settings
DROP POLICY IF EXISTS "communities_read" ON public.communities;
CREATE POLICY "communities_read" ON public.communities FOR SELECT TO authenticated
USING (created_by IS NULL OR created_by = auth.uid() OR public.is_user_active(created_by));

DROP POLICY IF EXISTS "group_settings_read" ON public.group_settings;
CREATE POLICY "group_settings_read" ON public.group_settings FOR SELECT TO authenticated
USING (public.is_group_member(group_id, auth.uid()) OR public.is_admin_user(auth.uid()));

-- singleton settings rows
DROP POLICY IF EXISTS "app_settings_read" ON public.app_settings;
CREATE POLICY "app_settings_read" ON public.app_settings FOR SELECT TO anon, authenticated
USING (id = 1);

DROP POLICY IF EXISTS "consent_settings_public_read" ON public.consent_settings;
CREATE POLICY "consent_settings_public_read" ON public.consent_settings FOR SELECT TO anon, authenticated
USING (id = 1);

-- storage: bind object reads to the uploader or to an existing referencing row
DROP POLICY IF EXISTS "profile_posts_storage_read" ON storage.objects;
DROP POLICY IF EXISTS "profile_posts_storage_public_read" ON storage.objects;
CREATE POLICY "profile_posts_storage_read" ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'profile-posts'
  AND (
    owner_id = (SELECT auth.uid()::text)
    OR (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    OR EXISTS (SELECT 1 FROM public.profile_posts p WHERE p.image_url = objects.name)
    OR EXISTS (SELECT 1 FROM public.feed_posts f WHERE f.image_url = objects.name)
  )
);

DROP POLICY IF EXISTS "feed_stories_storage_read" ON storage.objects;
CREATE POLICY "feed_stories_storage_read" ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'feed-stories'
  AND (
    owner_id = (SELECT auth.uid()::text)
    OR (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    OR EXISTS (SELECT 1 FROM public.feed_stories s WHERE s.image_url = objects.name)
  )
);

DROP POLICY IF EXISTS "feed_documents_storage_read" ON storage.objects;
CREATE POLICY "feed_documents_storage_read" ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'feed-documents'
  AND (
    owner_id = (SELECT auth.uid()::text)
    OR (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    OR EXISTS (SELECT 1 FROM public.feed_posts f WHERE f.document_url = objects.name)
  )
);