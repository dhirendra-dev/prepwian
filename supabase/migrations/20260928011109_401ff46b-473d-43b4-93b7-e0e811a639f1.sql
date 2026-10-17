ALTER TABLE public.direct_messages
ADD COLUMN reply_to_id uuid NULL REFERENCES public.direct_messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS direct_messages_reply_to_id_idx
ON public.direct_messages (reply_to_id)
WHERE reply_to_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_direct_message_reply()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  parent_sender uuid;
  parent_recipient uuid;
BEGIN
  IF NEW.reply_to_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT sender_id, recipient_id
  INTO parent_sender, parent_recipient
  FROM public.direct_messages
  WHERE id = NEW.reply_to_id;

  IF parent_sender IS NULL OR NOT (
    (parent_sender = NEW.sender_id AND parent_recipient = NEW.recipient_id)
    OR
    (parent_sender = NEW.recipient_id AND parent_recipient = NEW.sender_id)
  ) THEN
    RAISE EXCEPTION 'Reply target must belong to the same conversation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_direct_message_reply_trigger
BEFORE INSERT OR UPDATE OF reply_to_id, sender_id, recipient_id
ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.validate_direct_message_reply();