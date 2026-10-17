
-- 1) Fix mirror_profile_post_to_feed: restore fallback body for captionless photos
CREATE OR REPLACE FUNCTION public.mirror_profile_post_to_feed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  body_text text;
BEGIN
  body_text := COALESCE(NULLIF(btrim(NEW.caption), ''), '📸 shared a new photo');
  INSERT INTO public.feed_posts (user_id, body, image_url, source_profile_post_id)
  VALUES (NEW.user_id, body_text, NEW.image_url, NEW.id);
  RETURN NEW;
END;
$function$;

-- 2) Grant EXECUTE on list_admin_ids to anon + authenticated so feed/profile can call it
GRANT EXECUTE ON FUNCTION public.list_admin_ids() TO anon, authenticated;

-- 3) study_totals_since: return all users so dashboard can rank
CREATE OR REPLACE FUNCTION public.study_totals_since(_since timestamp with time zone)
 RETURNS TABLE(user_id uuid, total_seconds bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT s.user_id, COALESCE(SUM(s.duration_seconds), 0)::bigint
  FROM public.study_sessions s
  WHERE s.ended_at >= _since
  GROUP BY s.user_id;
$function$;

GRANT EXECUTE ON FUNCTION public.study_totals_since(timestamp with time zone) TO anon, authenticated;
