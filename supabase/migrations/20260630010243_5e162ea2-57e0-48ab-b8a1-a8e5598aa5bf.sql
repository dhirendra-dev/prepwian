
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS sch, p.proname AS fn, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon, PUBLIC', r.sch, r.fn, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, service_role', r.sch, r.fn, r.args);
  END LOOP;
END $$;
