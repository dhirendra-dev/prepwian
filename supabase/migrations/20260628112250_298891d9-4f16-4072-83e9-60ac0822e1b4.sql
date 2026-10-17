CREATE OR REPLACE FUNCTION public.notify_on_feed_like()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  liker_name text;
  post_author uuid;
BEGIN
  IF NEW.target_type <> 'post' THEN
    RETURN NEW;
  END IF;
  SELECT user_id INTO post_author FROM public.feed_posts WHERE id = NEW.target_id;
  IF post_author IS NULL OR post_author = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, 'Someone') INTO liker_name
  FROM public.profiles WHERE id = NEW.user_id;

  INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
  VALUES (
    '❤️ ' || liker_name || ' liked your post',
    NULL,
    '/feed',
    'user',
    post_author,
    NEW.user_id
  );
  RETURN NEW;
END $function$;