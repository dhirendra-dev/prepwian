-- Widen SELECT policies to include anon visitors for public-facing content.
DROP POLICY IF EXISTS "Signed-in users can view active community groups" ON public.community_groups;
CREATE POLICY "Anyone can view active community groups"
  ON public.community_groups FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "feed_posts authenticated read" ON public.feed_posts;
CREATE POLICY "feed_posts public read"
  ON public.feed_posts FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "chat read authenticated" ON public.chat_messages;
CREATE POLICY "chat public read"
  ON public.chat_messages FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles publicly viewable"
  ON public.profiles FOR SELECT TO anon, authenticated USING (true);

-- Also widen feed comments/likes and chat reactions for consistent public rendering.
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname, tablename FROM pg_policies
    WHERE schemaname='public'
      AND tablename IN ('feed_comments','feed_likes','chat_message_reactions','follows','user_certificates','certificate_types','polls','poll_votes','materials','forum_threads','forum_replies')
      AND cmd='SELECT' AND roles = '{authenticated}'
  LOOP
    EXECUTE format('ALTER POLICY %I ON public.%I TO anon, authenticated', p.policyname, p.tablename);
  END LOOP;
END $$;