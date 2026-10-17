-- ── Video likes ──────────────────────────────────────────────────────────────
CREATE TABLE public.video_likes (
  video_id uuid NOT NULL REFERENCES public.video_lectures(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (video_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.video_likes TO authenticated;
GRANT SELECT ON public.video_likes TO anon;
GRANT ALL ON public.video_likes TO service_role;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "video_likes_select_all" ON public.video_likes FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "video_likes_insert_own" ON public.video_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.can_user_post(auth.uid()));
CREATE POLICY "video_likes_delete_own" ON public.video_likes FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX idx_video_likes_video ON public.video_likes(video_id);

-- ── Video comments ───────────────────────────────────────────────────────────
CREATE TABLE public.video_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.video_lectures(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text text NOT NULL CHECK (char_length(comment_text) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.video_comments TO authenticated;
GRANT SELECT ON public.video_comments TO anon;
GRANT ALL ON public.video_comments TO service_role;
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "video_comments_select_all" ON public.video_comments FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "video_comments_insert_own" ON public.video_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.can_user_post(auth.uid()));
CREATE POLICY "video_comments_delete_own_or_admin" ON public.video_comments FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_video_comments_video ON public.video_comments(video_id, created_at);

-- ── Continue watching ────────────────────────────────────────────────────────
CREATE TABLE public.video_watch_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.video_lectures(id) ON DELETE CASCADE,
  position_seconds integer NOT NULL DEFAULT 0,
  duration_seconds integer,
  completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_watch_progress TO authenticated;
GRANT ALL ON public.video_watch_progress TO service_role;
ALTER TABLE public.video_watch_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vwp_select_own" ON public.video_watch_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "vwp_insert_own" ON public.video_watch_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "vwp_update_own" ON public.video_watch_progress FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "vwp_delete_own" ON public.video_watch_progress FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER trg_vwp_touch BEFORE UPDATE ON public.video_watch_progress FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── Synced playlists ─────────────────────────────────────────────────────────
CREATE TABLE public.synced_playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_playlist_id text NOT NULL UNIQUE,
  title text,
  subject text NOT NULL,
  chapter text,
  added_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_synced_at timestamptz,
  last_status text NOT NULL DEFAULT 'pending',
  last_error text,
  videos_added integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.synced_playlists TO authenticated;
GRANT ALL ON public.synced_playlists TO service_role;
ALTER TABLE public.synced_playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "synced_playlists_admin_all" ON public.synced_playlists FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_synced_playlists_touch BEFORE UPDATE ON public.synced_playlists FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── Pulse feed view: real like/comment counts for videos ─────────────────────
CREATE OR REPLACE VIEW public.pulse_feed_items AS
  SELECT v.id,
     'video'::text AS item_type,
     v.title,
     NULL::text AS body_text,
     NULL::uuid AS author_id,
     NULL::text AS author_name,
     NULL::text AS author_avatar_url,
     NULL::text AS image_url,
     v.youtube_video_id,
     v.subject,
     v.chapter,
     (SELECT count(*) FROM public.video_likes vl WHERE vl.video_id = v.id) AS like_count,
     (SELECT count(*) FROM public.video_comments vc WHERE vc.video_id = v.id) AS comment_count,
     v.created_at
    FROM public.video_lectures v
   WHERE v.is_published = true
UNION ALL
  SELECT p.id,
     'post'::text AS item_type,
     NULL::text AS title,
     p.body AS body_text,
     p.user_id AS author_id,
     pr.full_name AS author_name,
     pr.avatar_url AS author_avatar_url,
     p.image_url,
     NULL::text AS youtube_video_id,
     NULL::text AS subject,
     NULL::text AS chapter,
     (SELECT count(*) FROM public.feed_likes l WHERE l.target_type = 'post' AND l.target_id = p.id) AS like_count,
     (SELECT count(*) FROM public.feed_comments c WHERE c.post_id = p.id) AS comment_count,
     p.created_at
    FROM public.feed_posts p
    LEFT JOIN public.profiles pr ON pr.id = p.user_id;
GRANT SELECT ON public.pulse_feed_items TO anon, authenticated;