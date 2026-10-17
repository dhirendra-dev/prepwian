-- Make both public views run with the querying user's permissions instead of the creator's.
ALTER VIEW public.public_profiles SET (security_invoker = on);
ALTER VIEW public.pulse_feed_items SET (security_invoker = on);

-- Visitors who are not signed in must still be able to read public author info,
-- limited to non-guest profiles and only the safe, already-public columns.
DROP POLICY IF EXISTS "public profile info readable by visitors" ON public.profiles;
CREATE POLICY "public profile info readable by visitors"
ON public.profiles
FOR SELECT
TO anon
USING (is_guest IS NOT TRUE);

REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, full_name, username, avatar_url, bio, class_level,
  created_at, verified, instagram, youtube, telegram, website
) ON public.profiles TO anon;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
GRANT SELECT ON public.pulse_feed_items TO anon, authenticated;