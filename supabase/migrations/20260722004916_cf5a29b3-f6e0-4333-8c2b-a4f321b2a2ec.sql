
-- 1. Onboarding flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_seen_onboarding boolean NOT NULL DEFAULT false;

-- 2. Feed posts: optional image + source
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS source_profile_post_id uuid REFERENCES public.profile_posts(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS feed_posts_source_profile_post_idx ON public.feed_posts(source_profile_post_id) WHERE source_profile_post_id IS NOT NULL;

-- 3. Trigger: when a profile_post is created, mirror it into feed_posts
CREATE OR REPLACE FUNCTION public.mirror_profile_post_to_feed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.feed_posts (user_id, body, image_url, source_profile_post_id)
  VALUES (
    NEW.user_id,
    COALESCE(NULLIF(NEW.caption, ''), '📸 shared a new photo'),
    NEW.image_url,
    NEW.id
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_mirror_profile_post_to_feed ON public.profile_posts;
CREATE TRIGGER trg_mirror_profile_post_to_feed
AFTER INSERT ON public.profile_posts
FOR EACH ROW EXECUTE FUNCTION public.mirror_profile_post_to_feed();

REVOKE EXECUTE ON FUNCTION public.mirror_profile_post_to_feed() FROM PUBLIC, anon, authenticated;
