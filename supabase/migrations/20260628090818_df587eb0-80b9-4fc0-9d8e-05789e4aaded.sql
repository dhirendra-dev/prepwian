
-- Notify on community live chat
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
  -- dedupe: skip if sender posted in last 30 minutes
  SELECT EXISTS(
    SELECT 1 FROM public.chat_messages
    WHERE user_id = NEW.user_id
      AND id <> NEW.id
      AND created_at > (NEW.created_at - interval '30 minutes')
  ) INTO recent_exists;
  IF recent_exists THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, 'Someone') INTO sender_name
  FROM public.profiles WHERE id = NEW.user_id;

  preview := left(COALESCE(NEW.body, ''), 80);

  INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
  VALUES (
    sender_name || ' joined the live chat',
    CASE WHEN preview = '' THEN NULL ELSE '"' || preview || '"' END,
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

-- Notify on squad messages (only members)
CREATE OR REPLACE FUNCTION public.notify_on_squad_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name text;
  group_name text;
  recent_exists boolean;
  preview text;
  m record;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.study_group_messages
    WHERE group_id = NEW.group_id
      AND user_id = NEW.user_id
      AND id <> NEW.id
      AND created_at > (NEW.created_at - interval '30 minutes')
  ) INTO recent_exists;
  IF recent_exists THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, 'Someone') INTO sender_name
  FROM public.profiles WHERE id = NEW.user_id;

  SELECT COALESCE(name, 'your squad') INTO group_name
  FROM public.study_groups WHERE id = NEW.group_id;

  preview := left(COALESCE(NEW.body, ''), 80);

  FOR m IN
    SELECT user_id FROM public.study_group_members
    WHERE group_id = NEW.group_id AND user_id <> NEW.user_id
  LOOP
    INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
    VALUES (
      sender_name || ' is chatting in ' || group_name,
      CASE WHEN preview = '' THEN NULL ELSE '"' || preview || '"' END,
      '/squad/' || NEW.group_id::text,
      'user',
      m.user_id,
      NEW.user_id
    );
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_on_squad_message ON public.study_group_messages;
CREATE TRIGGER trg_notify_on_squad_message
AFTER INSERT ON public.study_group_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_squad_message();
