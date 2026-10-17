
-- Remove 5-min cooldown on community chat: notify everyone for every message
CREATE OR REPLACE FUNCTION public.notify_on_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sender_name text;
  preview text;
BEGIN
  SELECT COALESCE(full_name, 'Someone') INTO sender_name
  FROM public.profiles WHERE id = NEW.user_id;

  preview := left(COALESCE(NEW.body, ''), 80);

  INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
  VALUES (
    '💬 ' || sender_name || ' in community chat',
    COALESCE(NULLIF('"' || preview || '"', '""'), 'Tap to join the conversation.'),
    '/community',
    'all',
    NULL,
    NEW.user_id
  );
  RETURN NEW;
END $function$;

-- Notify everyone on new feed posts
CREATE OR REPLACE FUNCTION public.notify_on_feed_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  author_name text;
  preview text;
BEGIN
  SELECT COALESCE(full_name, 'Someone') INTO author_name
  FROM public.profiles WHERE id = NEW.user_id;
  preview := left(COALESCE(NEW.body, ''), 100);

  INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
  VALUES (
    '📝 ' || author_name || ' posted in the feed',
    COALESCE(NULLIF('"' || preview || '"', '""'), 'Tap to view the new post.'),
    '/feed',
    'all',
    NULL,
    NEW.user_id
  );
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_notify_on_feed_post ON public.feed_posts;
CREATE TRIGGER trg_notify_on_feed_post
AFTER INSERT ON public.feed_posts
FOR EACH ROW EXECUTE FUNCTION public.notify_on_feed_post();

-- Notify post author on new comments
CREATE OR REPLACE FUNCTION public.notify_on_feed_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  commenter_name text;
  post_author uuid;
  preview text;
BEGIN
  SELECT user_id INTO post_author FROM public.feed_posts WHERE id = NEW.post_id;
  IF post_author IS NULL OR post_author = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, 'Someone') INTO commenter_name
  FROM public.profiles WHERE id = NEW.user_id;
  preview := left(COALESCE(NEW.body, ''), 100);

  INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
  VALUES (
    '💬 ' || commenter_name || ' commented on your post',
    COALESCE(NULLIF('"' || preview || '"', '""'), 'Tap to view the comment.'),
    '/feed',
    'user',
    post_author,
    NEW.user_id
  );
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_notify_on_feed_comment ON public.feed_comments;
CREATE TRIGGER trg_notify_on_feed_comment
AFTER INSERT ON public.feed_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_on_feed_comment();

-- Notify post author on new likes
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
  IF NEW.post_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT user_id INTO post_author FROM public.feed_posts WHERE id = NEW.post_id;
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

DROP TRIGGER IF EXISTS trg_notify_on_feed_like ON public.feed_likes;
CREATE TRIGGER trg_notify_on_feed_like
AFTER INSERT ON public.feed_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_on_feed_like();
