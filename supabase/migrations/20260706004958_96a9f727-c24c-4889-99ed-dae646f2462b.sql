GRANT SELECT, INSERT, UPDATE ON public.study_sessions TO authenticated;
GRANT ALL ON public.study_sessions TO service_role;
REVOKE DELETE ON public.study_sessions FROM authenticated;
DROP POLICY IF EXISTS "Users delete their own sessions" ON public.study_sessions;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'study_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;
  END IF;
END $$;