-- Canonical XP rewards for meaningful authenticated UI actions and daily logins.
-- The existing user_xp and xp_transactions tables remain the source of truth.

CREATE TABLE IF NOT EXISTS public.user_xp (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp integer NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  source_type text NOT NULL,
  source_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS xp_transactions_user_source_key
  ON public.xp_transactions(user_id, source_type, source_id);

ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "XP totals are public" ON public.user_xp;
CREATE POLICY "XP totals are public" ON public.user_xp
  FOR SELECT TO anon, authenticated
  USING (user_id = auth.uid() OR public.is_user_active(user_id));

DROP POLICY IF EXISTS "Users can read own XP transactions" ON public.xp_transactions;
CREATE POLICY "Users can read own XP transactions" ON public.xp_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.award_action_xp(
  p_source_type text,
  p_source_id text,
  p_reason text DEFAULT 'Completed an action'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_inserted boolean := false;
  v_total integer;
BEGIN
  IF v_user IS NULL OR p_source_type IS NULL OR p_source_id IS NULL THEN
    RETURN jsonb_build_object('awarded', false, 'total_xp', 0);
  END IF;

  INSERT INTO public.xp_transactions (user_id, amount, reason, source_type, source_id)
  VALUES (v_user, 4, left(coalesce(nullif(trim(p_reason), ''), 'Completed an action'), 160), left(p_source_type, 80), left(p_source_id, 180))
  ON CONFLICT (user_id, source_type, source_id) DO NOTHING;
  v_inserted := FOUND;

  IF v_inserted THEN
    INSERT INTO public.user_xp (user_id, total_xp, updated_at)
    VALUES (v_user, 4, now())
    ON CONFLICT (user_id) DO UPDATE
      SET total_xp = public.user_xp.total_xp + 4, updated_at = now();
  END IF;

  SELECT total_xp INTO v_total FROM public.user_xp WHERE user_id = v_user;
  RETURN jsonb_build_object('awarded', v_inserted, 'amount', CASE WHEN v_inserted THEN 4 ELSE 0 END, 'total_xp', coalesce(v_total, 0));
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_login_xp()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_day text := to_char((now() AT TIME ZONE 'Asia/Kolkata')::date, 'YYYY-MM-DD');
  v_inserted boolean := false;
  v_total integer;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('awarded', false, 'total_xp', 0);
  END IF;

  INSERT INTO public.xp_transactions (user_id, amount, reason, source_type, source_id)
  VALUES (v_user, 10, 'Daily login', 'login', v_day)
  ON CONFLICT (user_id, source_type, source_id) DO NOTHING;
  v_inserted := FOUND;

  IF v_inserted THEN
    INSERT INTO public.user_xp (user_id, total_xp, updated_at)
    VALUES (v_user, 10, now())
    ON CONFLICT (user_id) DO UPDATE
      SET total_xp = public.user_xp.total_xp + 10, updated_at = now();
  END IF;

  SELECT total_xp INTO v_total FROM public.user_xp WHERE user_id = v_user;
  RETURN jsonb_build_object('awarded', v_inserted, 'amount', CASE WHEN v_inserted THEN 10 ELSE 0 END, 'total_xp', coalesce(v_total, 0));
END;
$$;

REVOKE ALL ON FUNCTION public.award_action_xp(text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_login_xp() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_action_xp(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_login_xp() TO authenticated;
