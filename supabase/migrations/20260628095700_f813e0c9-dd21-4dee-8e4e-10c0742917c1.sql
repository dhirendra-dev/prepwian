DROP POLICY IF EXISTS "Read notifications addressed to user" ON public.notifications;
CREATE POLICY "Read notifications addressed to user" ON public.notifications
FOR SELECT USING (
  audience = 'all' OR target_user_id = auth.uid()
);