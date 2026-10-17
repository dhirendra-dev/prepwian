
-- Notify when someone follows you
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_name text;
BEGIN
  IF NEW.follower_id = NEW.following_id THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, 'Someone') INTO follower_name FROM public.profiles WHERE id = NEW.follower_id;
  INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
  VALUES (
    follower_name || ' started following you',
    'Tap to view their profile and follow back.',
    '/u/' || NEW.follower_id::text,
    'user',
    NEW.following_id,
    NEW.follower_id
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_on_follow ON public.follows;
CREATE TRIGGER trg_notify_on_follow
AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- Notify recipient on first DM in a thread (message request)
CREATE OR REPLACE FUNCTION public.notify_on_first_dm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name text;
  prior_count int;
  is_request boolean;
  preview text;
BEGIN
  SELECT count(*) INTO prior_count
  FROM public.direct_messages
  WHERE id <> NEW.id
    AND ((sender_id = NEW.sender_id AND recipient_id = NEW.recipient_id)
      OR (sender_id = NEW.recipient_id AND recipient_id = NEW.sender_id));

  -- only notify on first message OR every message if recipient doesn't follow sender (request)
  is_request := NOT EXISTS (
    SELECT 1 FROM public.follows WHERE follower_id = NEW.recipient_id AND following_id = NEW.sender_id
  );

  IF prior_count > 0 AND NOT is_request THEN RETURN NEW; END IF;

  SELECT COALESCE(full_name, 'Someone') INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  preview := left(COALESCE(NEW.body, ''), 80);

  INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
  VALUES (
    CASE WHEN is_request AND prior_count = 0 THEN sender_name || ' wants to chat with you'
         ELSE sender_name || ' sent you a message' END,
    CASE WHEN preview = '' THEN NULL ELSE '"' || preview || '"' END,
    '/messages/' || NEW.sender_id::text,
    'user',
    NEW.recipient_id,
    NEW.sender_id
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_on_first_dm ON public.direct_messages;
CREATE TRIGGER trg_notify_on_first_dm
AFTER INSERT ON public.direct_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_first_dm();
