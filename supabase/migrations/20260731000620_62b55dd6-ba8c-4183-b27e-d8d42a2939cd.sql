DROP POLICY IF EXISTS "votes readable by all" ON public.poll_votes;

CREATE POLICY "users read own votes" ON public.poll_votes
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.poll_vote_counts(_poll_ids uuid[])
RETURNS TABLE(poll_id uuid, option_id text, votes bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pv.poll_id, pv.option_id, count(*)::bigint
  FROM public.poll_votes pv
  WHERE pv.poll_id = ANY(_poll_ids)
  GROUP BY pv.poll_id, pv.option_id
$$;

REVOKE ALL ON FUNCTION public.poll_vote_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.poll_vote_counts(uuid[]) TO anon, authenticated;