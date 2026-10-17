DO $$ BEGIN
  CREATE TYPE public.squad_notify_mode AS ENUM ('all','important','muted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.squad_notification_prefs (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  mode public.squad_notify_mode NOT NULL DEFAULT 'all',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, group_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_notification_prefs TO authenticated;
GRANT ALL ON public.squad_notification_prefs TO service_role;
ALTER TABLE public.squad_notification_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own prefs read" ON public.squad_notification_prefs;
DROP POLICY IF EXISTS "own prefs write" ON public.squad_notification_prefs;
DROP POLICY IF EXISTS "own prefs update" ON public.squad_notification_prefs;
DROP POLICY IF EXISTS "own prefs delete" ON public.squad_notification_prefs;

CREATE POLICY "own prefs read" ON public.squad_notification_prefs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own prefs write" ON public.squad_notification_prefs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own prefs update" ON public.squad_notification_prefs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own prefs delete" ON public.squad_notification_prefs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Update trigger to respect prefs.
-- Important = body contains '@everyone', '@important', or starts with '!important'.
CREATE OR REPLACE FUNCTION public.notify_on_squad_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sender_name text;
  group_name text;
  recent_exists boolean;
  preview text;
  is_important boolean;
  m record;
  pref public.squad_notify_mode;
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
  is_important := (
    NEW.body ILIKE '%@everyone%' OR
    NEW.body ILIKE '%@important%' OR
    NEW.body ILIKE '!important%'
  );

  FOR m IN
    SELECT user_id FROM public.study_group_members
    WHERE group_id = NEW.group_id AND user_id <> NEW.user_id
  LOOP
    SELECT mode INTO pref FROM public.squad_notification_prefs
      WHERE user_id = m.user_id AND group_id = NEW.group_id;
    IF pref IS NULL THEN pref := 'all'; END IF;
    IF pref = 'muted' THEN CONTINUE; END IF;
    IF pref = 'important' AND NOT is_important THEN CONTINUE; END IF;

    INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
    VALUES (
      sender_name || (CASE WHEN is_important THEN ' · ⚠ important in ' ELSE ' is chatting in ' END) || group_name,
      CASE WHEN preview = '' THEN NULL ELSE '"' || preview || '"' END,
      '/squad/' || NEW.group_id::text,
      'user',
      m.user_id,
      NEW.user_id
    );
  END LOOP;
  RETURN NEW;
END $function$;