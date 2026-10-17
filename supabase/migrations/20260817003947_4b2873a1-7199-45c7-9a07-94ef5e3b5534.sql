CREATE OR REPLACE FUNCTION public.public_feed_authors(_ids uuid[])
RETURNS TABLE(id uuid, full_name text, avatar_url text, username text, verified boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.avatar_url, p.username, coalesce(p.verified, false)
  FROM public.profiles p
  WHERE p.id = ANY(_ids)
    AND p.is_guest IS NOT TRUE
$$;

REVOKE ALL ON FUNCTION public.public_feed_authors(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_feed_authors(uuid[]) TO anon, authenticated, service_role;