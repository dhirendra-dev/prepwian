
CREATE OR REPLACE FUNCTION public.notify_on_first_dm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sender_name text;
  is_request boolean;
  preview text;
  prior_count int;
BEGIN
  SELECT count(*) INTO prior_count
  FROM public.direct_messages
  WHERE id <> NEW.id
    AND ((sender_id = NEW.sender_id AND recipient_id = NEW.recipient_id)
      OR (sender_id = NEW.recipient_id AND recipient_id = NEW.sender_id));

  is_request := (prior_count = 0) AND NOT EXISTS (
    SELECT 1 FROM public.follows WHERE follower_id = NEW.recipient_id AND following_id = NEW.sender_id
  );

  SELECT COALESCE(full_name, 'Someone') INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  preview := left(COALESCE(NEW.body, ''), 100);

  INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
  VALUES (
    CASE WHEN is_request THEN '📩 ' || sender_name || ' wants to chat with you'
         ELSE '💬 ' || sender_name || ' sent you a message' END,
    CASE WHEN preview = '' THEN NULL ELSE '"' || preview || '"' END,
    '/messages/' || NEW.sender_id::text,
    'user',
    NEW.recipient_id,
    NEW.sender_id
  );
  RETURN NEW;
END $function$;
