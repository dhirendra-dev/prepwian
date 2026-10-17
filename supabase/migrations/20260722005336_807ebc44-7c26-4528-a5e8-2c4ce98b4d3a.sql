
-- Add optional image + link to source profile post
ALTER TABLE public.feed_posts
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS source_profile_post_id uuid;

CREATE INDEX IF NOT EXISTS feed_posts_source_profile_post_idx
  ON public.feed_posts (source_profile_post_id);

-- Mirror profile_posts -> feed_posts
CREATE OR REPLACE FUNCTION public.mirror_profile_post_to_feed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  body_text text;
  img text;
BEGIN
  body_text := COALESCE(NEW.caption, '');
  img := NEW.image_url;
  INSERT INTO public.feed_posts (user_id, body, image_url, source_profile_post_id)
  VALUES (NEW.user_id, body_text, img, NEW.id);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mirror_profile_post_to_feed() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.cleanup_mirrored_feed_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.feed_posts WHERE source_profile_post_id = OLD.id;
  RETURN OLD;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_mirrored_feed_post() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_mirror_profile_post_to_feed ON public.profile_posts;
CREATE TRIGGER trg_mirror_profile_post_to_feed
AFTER INSERT ON public.profile_posts
FOR EACH ROW EXECUTE FUNCTION public.mirror_profile_post_to_feed();

DROP TRIGGER IF EXISTS trg_cleanup_mirrored_feed_post ON public.profile_posts;
CREATE TRIGGER trg_cleanup_mirrored_feed_post
BEFORE DELETE ON public.profile_posts
FOR EACH ROW EXECUTE FUNCTION public.cleanup_mirrored_feed_post();
