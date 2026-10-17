
-- Restore Data API grants that were revoked by a prior security migration.
-- RLS remains enforced; grants only make tables reachable through PostgREST.

DO $$
DECLARE
  tbl record;
BEGIN
  FOR tbl IN
    SELECT c.relname AS table_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'r' AND n.nspname = 'public'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.table_name);
  END LOOP;
END $$;

-- Sequences (needed for inserts on tables with serial/identity columns)
DO $$
DECLARE
  s record;
BEGIN
  FOR s IN
    SELECT c.relname
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'S' AND n.nspname = 'public'
  LOOP
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE public.%I TO authenticated', s.relname);
    EXECUTE format('GRANT ALL ON SEQUENCE public.%I TO service_role', s.relname);
  END LOOP;
END $$;

-- Ensure future tables inherit the same grants (created by any role that owns public)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
