
-- 1. Chat pin/mark moderation trigger: only admins can change these columns
CREATE OR REPLACE FUNCTION public.guard_chat_moderation_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.pinned_at    := OLD.pinned_at;
    NEW.pinned_by    := OLD.pinned_by;
    NEW.marked_at    := OLD.marked_at;
    NEW.marked_by    := OLD.marked_by;
    NEW.marked_label := OLD.marked_label;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_guard_chat_moderation ON public.chat_messages;
CREATE TRIGGER trg_guard_chat_moderation
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.guard_chat_moderation_columns();

-- 2. Lock down study_sessions SELECT to owner only; expose aggregate via SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Anyone signed in can view study sessions for leaderboard" ON public.study_sessions;
DROP POLICY IF EXISTS "Users view own sessions" ON public.study_sessions;
CREATE POLICY "Users view own sessions"
  ON public.study_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.study_totals_since(_since timestamptz)
RETURNS TABLE(user_id uuid, total_seconds bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.user_id, COALESCE(SUM(s.duration_seconds), 0)::bigint AS total_seconds
  FROM public.study_sessions s
  WHERE s.ended_at >= _since
  GROUP BY s.user_id;
$$;
GRANT EXECUTE ON FUNCTION public.study_totals_since(timestamptz) TO authenticated;

-- 3. Restrict avatars bucket SELECT to authenticated users only
DROP POLICY IF EXISTS "Avatars are readable by anyone authenticated" ON storage.objects;
CREATE POLICY "Avatars are readable by authenticated users"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');
