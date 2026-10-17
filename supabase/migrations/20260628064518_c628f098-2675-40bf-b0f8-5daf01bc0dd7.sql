
CREATE TABLE public.study_group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX study_group_messages_group_created_idx ON public.study_group_messages(group_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_group_messages TO authenticated;
GRANT ALL ON public.study_group_messages TO service_role;

ALTER TABLE public.study_group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read squad messages"
ON public.study_group_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.study_group_members m
    WHERE m.group_id = study_group_messages.group_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Members can post squad messages"
ON public.study_group_messages FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.study_group_members m
    WHERE m.group_id = study_group_messages.group_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Senders, owners and admins can delete squad messages"
ON public.study_group_messages FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.study_groups g
    WHERE g.id = study_group_messages.group_id AND g.owner_id = auth.uid()
  )
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.study_group_messages;
