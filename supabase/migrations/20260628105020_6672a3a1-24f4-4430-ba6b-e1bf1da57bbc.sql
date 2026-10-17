CREATE OR REPLACE FUNCTION public.notify_on_squad_join()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  joiner_name text;
  group_name text;
  m record;
BEGIN
  SELECT COALESCE(full_name, 'Someone') INTO joiner_name FROM public.profiles WHERE id = NEW.user_id;
  SELECT COALESCE(name, 'a squad') INTO group_name FROM public.study_groups WHERE id = NEW.group_id;

  FOR m IN
    SELECT user_id FROM public.study_group_members
    WHERE group_id = NEW.group_id AND user_id <> NEW.user_id
  LOOP
    INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
    VALUES (
      '👋 ' || joiner_name || ' joined ' || group_name,
      'Say hi in the squad chat.',
      '/squad/' || NEW.group_id::text,
      'user',
      m.user_id,
      NEW.user_id
    );
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_on_squad_join ON public.study_group_members;
CREATE TRIGGER trg_notify_on_squad_join
AFTER INSERT ON public.study_group_members
FOR EACH ROW EXECUTE FUNCTION public.notify_on_squad_join();

-- Re-attach existing message triggers (in case missing)
DROP TRIGGER IF EXISTS trg_notify_on_chat_message ON public.chat_messages;
CREATE TRIGGER trg_notify_on_chat_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_chat_message();

DROP TRIGGER IF EXISTS trg_notify_on_squad_message ON public.study_group_messages;
CREATE TRIGGER trg_notify_on_squad_message
AFTER INSERT ON public.study_group_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_squad_message();