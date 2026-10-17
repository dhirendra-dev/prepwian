-- Additive JEE Prep Hub Threads migration. Existing threads/replies are preserved.
BEGIN;
ALTER TABLE public.forum_threads ADD COLUMN IF NOT EXISTS attachment_urls text[] NOT NULL DEFAULT '{}', ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}', ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;
ALTER TABLE public.forum_replies ADD COLUMN IF NOT EXISTS attachment_urls text[] NOT NULL DEFAULT '{}', ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.forum_thread_reactions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, reaction_type text NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like','love','helpful')), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(thread_id,user_id,reaction_type));
CREATE TABLE IF NOT EXISTS public.forum_reply_reactions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reply_id uuid NOT NULL REFERENCES public.forum_replies(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, reaction_type text NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like','love','helpful')), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(reply_id,user_id,reaction_type));
CREATE TABLE IF NOT EXISTS public.forum_thread_bookmarks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(thread_id,user_id));
CREATE TABLE IF NOT EXISTS public.forum_thread_follows (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(thread_id,user_id));
CREATE TABLE IF NOT EXISTS public.forum_thread_reports (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE, reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, reason text NOT NULL CHECK(char_length(reason) BETWEEN 3 AND 1000), status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewing','resolved','dismissed')), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(thread_id,reporter_id));

CREATE INDEX IF NOT EXISTS forum_threads_created_at_idx ON public.forum_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS forum_threads_subject_created_at_idx ON public.forum_threads(subject,created_at DESC);
CREATE INDEX IF NOT EXISTS forum_replies_thread_created_at_idx ON public.forum_replies(thread_id,created_at ASC);
CREATE INDEX IF NOT EXISTS forum_thread_reactions_thread_idx ON public.forum_thread_reactions(thread_id);
CREATE INDEX IF NOT EXISTS forum_reply_reactions_reply_idx ON public.forum_reply_reactions(reply_id);
CREATE INDEX IF NOT EXISTS forum_thread_bookmarks_user_idx ON public.forum_thread_bookmarks(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS forum_thread_follows_user_idx ON public.forum_thread_follows(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS forum_thread_reports_status_idx ON public.forum_thread_reports(status,created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.forum_thread_reactions TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.forum_reply_reactions TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.forum_thread_bookmarks TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.forum_thread_follows TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.forum_thread_reports TO authenticated;
ALTER TABLE public.forum_thread_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reply_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_thread_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_thread_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_thread_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS forum_thread_reactions_read ON public.forum_thread_reactions;
CREATE POLICY forum_thread_reactions_read ON public.forum_thread_reactions FOR SELECT TO authenticated USING(true);
DROP POLICY IF EXISTS forum_thread_reactions_insert_own ON public.forum_thread_reactions;
CREATE POLICY forum_thread_reactions_insert_own ON public.forum_thread_reactions FOR INSERT TO authenticated WITH CHECK(auth.uid()=user_id);
DROP POLICY IF EXISTS forum_thread_reactions_delete_own ON public.forum_thread_reactions;
CREATE POLICY forum_thread_reactions_delete_own ON public.forum_thread_reactions FOR DELETE TO authenticated USING(auth.uid()=user_id);

DROP POLICY IF EXISTS forum_reply_reactions_read ON public.forum_reply_reactions;
CREATE POLICY forum_reply_reactions_read ON public.forum_reply_reactions FOR SELECT TO authenticated USING(true);
DROP POLICY IF EXISTS forum_reply_reactions_insert_own ON public.forum_reply_reactions;
CREATE POLICY forum_reply_reactions_insert_own ON public.forum_reply_reactions FOR INSERT TO authenticated WITH CHECK(auth.uid()=user_id);
DROP POLICY IF EXISTS forum_reply_reactions_delete_own ON public.forum_reply_reactions;
CREATE POLICY forum_reply_reactions_delete_own ON public.forum_reply_reactions FOR DELETE TO authenticated USING(auth.uid()=user_id);

DROP POLICY IF EXISTS forum_thread_bookmarks_read_own ON public.forum_thread_bookmarks;
CREATE POLICY forum_thread_bookmarks_read_own ON public.forum_thread_bookmarks FOR SELECT TO authenticated USING(auth.uid()=user_id);
DROP POLICY IF EXISTS forum_thread_bookmarks_insert_own ON public.forum_thread_bookmarks;
CREATE POLICY forum_thread_bookmarks_insert_own ON public.forum_thread_bookmarks FOR INSERT TO authenticated WITH CHECK(auth.uid()=user_id);
DROP POLICY IF EXISTS forum_thread_bookmarks_delete_own ON public.forum_thread_bookmarks;
CREATE POLICY forum_thread_bookmarks_delete_own ON public.forum_thread_bookmarks FOR DELETE TO authenticated USING(auth.uid()=user_id);

DROP POLICY IF EXISTS forum_thread_follows_read_own ON public.forum_thread_follows;
CREATE POLICY forum_thread_follows_read_own ON public.forum_thread_follows FOR SELECT TO authenticated USING(auth.uid()=user_id);
DROP POLICY IF EXISTS forum_thread_follows_insert_own ON public.forum_thread_follows;
CREATE POLICY forum_thread_follows_insert_own ON public.forum_thread_follows FOR INSERT TO authenticated WITH CHECK(auth.uid()=user_id);
DROP POLICY IF EXISTS forum_thread_follows_delete_own ON public.forum_thread_follows;
CREATE POLICY forum_thread_follows_delete_own ON public.forum_thread_follows FOR DELETE TO authenticated USING(auth.uid()=user_id);

DROP POLICY IF EXISTS forum_thread_reports_insert_own ON public.forum_thread_reports;
CREATE POLICY forum_thread_reports_insert_own ON public.forum_thread_reports FOR INSERT TO authenticated WITH CHECK(auth.uid()=reporter_id);
DROP POLICY IF EXISTS forum_thread_reports_read_own_or_admin ON public.forum_thread_reports;
CREATE POLICY forum_thread_reports_read_own_or_admin ON public.forum_thread_reports FOR SELECT TO authenticated USING(auth.uid()=reporter_id OR has_role(auth.uid(),'admin'::app_role));
DROP POLICY IF EXISTS forum_thread_reports_update_admin ON public.forum_thread_reports;
CREATE POLICY forum_thread_reports_update_admin ON public.forum_thread_reports FOR UPDATE TO authenticated USING(has_role(auth.uid(),'admin'::app_role)) WITH CHECK(has_role(auth.uid(),'admin'::app_role));
COMMIT;
