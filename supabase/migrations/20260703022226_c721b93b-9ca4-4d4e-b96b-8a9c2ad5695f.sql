-- Restore GRANTs that were revoked by a prior migration.
-- RLS remains the security boundary; grants merely allow Data API to reach tables.

DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t.tablename);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t.tablename);
  END LOOP;
END $$;

-- Public-facing (anon read) tables: readable by unauthenticated visitors via existing permissive RLS.
GRANT SELECT ON public.community_groups TO anon;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.notices TO anon;
GRANT SELECT ON public.polls TO anon;
GRANT SELECT ON public.poll_votes TO anon;
GRANT SELECT ON public.certificate_types TO anon;
GRANT SELECT ON public.user_certificates TO anon;
GRANT SELECT ON public.chat_messages TO anon;
GRANT SELECT ON public.chat_message_reactions TO anon;
GRANT SELECT ON public.feed_posts TO anon;
GRANT SELECT ON public.feed_comments TO anon;
GRANT SELECT ON public.feed_likes TO anon;
GRANT SELECT ON public.materials TO anon;
GRANT SELECT ON public.forum_threads TO anon;
GRANT SELECT ON public.forum_replies TO anon;
GRANT SELECT ON public.follows TO anon;

-- Sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- Function execution
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated, anon, service_role;