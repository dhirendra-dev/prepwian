
-- profile_posts: Instagram-like posts on a user's profile
CREATE TABLE public.profile_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX profile_posts_user_id_created_idx ON public.profile_posts(user_id, created_at DESC);

GRANT SELECT ON public.profile_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_posts TO authenticated;
GRANT ALL ON public.profile_posts TO service_role;

ALTER TABLE public.profile_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_posts_select_all" ON public.profile_posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "profile_posts_insert_own" ON public.profile_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profile_posts_update_own" ON public.profile_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profile_posts_delete_own" ON public.profile_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER profile_posts_touch_updated_at BEFORE UPDATE ON public.profile_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Likes
CREATE TABLE public.profile_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.profile_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);
CREATE INDEX profile_post_likes_post_idx ON public.profile_post_likes(post_id);

GRANT SELECT ON public.profile_post_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.profile_post_likes TO authenticated;
GRANT ALL ON public.profile_post_likes TO service_role;

ALTER TABLE public.profile_post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ppl_select_all" ON public.profile_post_likes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ppl_insert_own" ON public.profile_post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ppl_delete_own" ON public.profile_post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments
CREATE TABLE public.profile_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.profile_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX profile_post_comments_post_idx ON public.profile_post_comments(post_id, created_at);

GRANT SELECT ON public.profile_post_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_post_comments TO authenticated;
GRANT ALL ON public.profile_post_comments TO service_role;

ALTER TABLE public.profile_post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ppc_select_all" ON public.profile_post_comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ppc_insert_own" ON public.profile_post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ppc_delete_own" ON public.profile_post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
