
ALTER TABLE public.study_groups ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.gen_squad_invite_code()
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE code TEXT; chars TEXT := 'abcdefghijkmnpqrstuvwxyz23456789'; i INT;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..10 LOOP
      code := code || substr(chars, 1 + floor(random()*length(chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.study_groups WHERE invite_code = code);
  END LOOP;
  RETURN code;
END $$;

UPDATE public.study_groups SET invite_code = public.gen_squad_invite_code() WHERE invite_code IS NULL;
ALTER TABLE public.study_groups ALTER COLUMN invite_code SET NOT NULL;

CREATE OR REPLACE FUNCTION public.ensure_squad_invite_code()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := public.gen_squad_invite_code();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ensure_squad_invite_code ON public.study_groups;
CREATE TRIGGER trg_ensure_squad_invite_code
  BEFORE INSERT ON public.study_groups
  FOR EACH ROW EXECUTE FUNCTION public.ensure_squad_invite_code();

DO $$ BEGIN
  CREATE TYPE public.squad_member_role AS ENUM ('member','admin','owner');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.study_group_members
  ADD COLUMN IF NOT EXISTS role public.squad_member_role NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.study_group_members m SET role = 'owner'
  FROM public.study_groups g
  WHERE g.id = m.group_id AND g.owner_id = m.user_id AND m.role <> 'owner';

CREATE OR REPLACE FUNCTION public.is_squad_admin(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.study_group_members
    WHERE group_id = _group_id AND user_id = _user_id AND role IN ('admin','owner')
  ) OR EXISTS (
    SELECT 1 FROM public.study_groups WHERE id = _group_id AND owner_id = _user_id
  );
$$;

DROP POLICY IF EXISTS "Users leave groups themselves" ON public.study_group_members;
DROP POLICY IF EXISTS "Squad admins can remove members" ON public.study_group_members;
CREATE POLICY "Squad admins can remove members"
  ON public.study_group_members FOR DELETE
  USING (public.is_squad_admin(group_id, auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Squad admins can update member roles" ON public.study_group_members;
CREATE POLICY "Squad admins can update member roles"
  ON public.study_group_members FOR UPDATE
  USING (public.is_squad_admin(group_id, auth.uid()) OR user_id = auth.uid())
  WITH CHECK (public.is_squad_admin(group_id, auth.uid()) OR user_id = auth.uid());

ALTER TABLE public.study_group_messages
  ADD COLUMN IF NOT EXISTS attachment_path TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT,
  ADD COLUMN IF NOT EXISTS attachment_type TEXT,
  ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

ALTER TABLE public.study_group_messages ALTER COLUMN body DROP NOT NULL;

DROP POLICY IF EXISTS "Senders, owners and admins can delete squad messages" ON public.study_group_messages;
DROP POLICY IF EXISTS "Senders, owners and squad admins delete messages" ON public.study_group_messages;
CREATE POLICY "Senders, owners and squad admins delete messages"
  ON public.study_group_messages FOR DELETE
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(),'admin'::app_role)
    OR public.is_squad_admin(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "Squad members can upload files" ON storage.objects;
CREATE POLICY "Squad members can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'squad-files'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.study_group_members m
      WHERE m.user_id = auth.uid()
        AND m.group_id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Squad members can read squad files" ON storage.objects;
CREATE POLICY "Squad members can read squad files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'squad-files'
    AND EXISTS (
      SELECT 1 FROM public.study_group_members m
      WHERE m.user_id = auth.uid()
        AND m.group_id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Uploaders and squad admins can delete squad files" ON storage.objects;
CREATE POLICY "Uploaders and squad admins can delete squad files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'squad-files'
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.study_group_members m
        WHERE m.user_id = auth.uid()
          AND m.group_id::text = (storage.foldername(name))[1]
          AND m.role IN ('admin','owner')
      )
    )
  );
