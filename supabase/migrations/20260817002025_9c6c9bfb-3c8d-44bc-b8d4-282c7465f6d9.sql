DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.sig);
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.get_squad_unread_counts(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.group_member_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_admin_ids() TO authenticated;
