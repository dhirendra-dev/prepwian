
CREATE OR REPLACE FUNCTION public.notify_on_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name text;
  recent_exists boolean;
  preview text;
BEGIN
  -- Global dedupe: at most one community-chat notification every 5 minutes
  SELECT EXISTS(
    SELECT 1 FROM public.notifications
    WHERE link = '/community'
      AND audience = 'all'
      AND created_at > (now() - interval '5 minutes')
  ) INTO recent_exists;
  IF recent_exists THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, 'Someone') INTO sender_name
  FROM public.profiles WHERE id = NEW.user_id;

  preview := left(COALESCE(NEW.body, ''), 80);

  INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
  VALUES (
    '💬 ' || sender_name || ' is chatting in the community',
    COALESCE(NULLIF('"' || preview || '"', '""'), 'Tap to join the conversation.'),
    '/community',
    'all',
    NULL,
    NEW.user_id
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_on_chat_message ON public.chat_messages;
CREATE TRIGGER trg_notify_on_chat_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_chat_message();
