DROP POLICY IF EXISTS "Users join groups themselves" ON public.group_members;

CREATE POLICY "Users join open groups themselves"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id
      AND (g.privacy = 'open'::group_privacy OR g.created_by = auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.join_group_via_invite(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  gid uuid;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _code IS NULL OR length(trim(_code)) < 4 THEN
    RAISE EXCEPTION 'Invalid invite';
  END IF;

  SELECT g.id INTO gid
  FROM public.groups g
  WHERE g.invite_code = trim(_code)
  LIMIT 1;

  IF gid IS NULL THEN
    RAISE EXCEPTION 'Invalid invite';
  END IF;

  INSERT INTO public.group_members (group_id, user_id)
  VALUES (gid, uid)
  ON CONFLICT DO NOTHING;

  RETURN gid;
END;
$$;

REVOKE ALL ON FUNCTION public.join_group_via_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_group_via_invite(text) TO authenticated;