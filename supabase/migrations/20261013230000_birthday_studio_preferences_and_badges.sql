BEGIN;

-- Party theme is a non-sensitive preference stored beside the existing birthday profile.
ALTER TABLE public.birthday_profiles
  ADD COLUMN IF NOT EXISTS party_theme text NOT NULL DEFAULT 'pastel';

ALTER TABLE public.birthday_profiles
  DROP CONSTRAINT IF EXISTS birthday_profiles_party_theme_check;
ALTER TABLE public.birthday_profiles
  ADD CONSTRAINT birthday_profiles_party_theme_check
  CHECK (party_theme IN ('pastel', 'galaxy', 'candy', 'golden'));

-- Achievement rows are private to their owner and are only readable/writable through
-- SECURITY DEFINER RPCs. No direct browser table grants are added.
CREATE TABLE IF NOT EXISTS public.birthday_achievements (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key text NOT NULL CHECK (badge_key IN (
    'balloon_friend', 'gift_opener', 'cake_cutter', 'firework_captain',
    'letter_keeper', 'capsule_finder', 'sparkle_caster', 'finale_star',
    'memory_maker', 'wish_giver'
  )),
  awarded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_key)
);

ALTER TABLE public.birthday_achievements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.birthday_achievements FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.birthday_my_party_theme()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT COALESCE(bp.party_theme, 'pastel')
  FROM (SELECT auth.uid() AS uid) AS caller
  LEFT JOIN public.birthday_profiles AS bp ON bp.user_id = caller.uid
  WHERE caller.uid IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.birthday_my_party_theme() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.birthday_my_party_theme() TO authenticated;

CREATE OR REPLACE FUNCTION public.birthday_save_my_party_theme(_theme text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in to save your birthday party theme.' USING ERRCODE = '28000';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM auth.users AS u
    LEFT JOIN public.profiles AS p ON p.id = u.id
    WHERE u.id = v_uid
      AND (u.is_anonymous IS TRUE OR p.is_guest IS TRUE)
  ) THEN
    RAISE EXCEPTION 'Create a full account to save your birthday party theme.' USING ERRCODE = '42501';
  END IF;
  IF _theme IS NULL OR _theme NOT IN ('pastel', 'galaxy', 'candy', 'golden') THEN
    RAISE EXCEPTION 'Choose a valid birthday party theme.' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles AS p WHERE p.id = v_uid) THEN
    RAISE EXCEPTION 'Your profile could not be prepared. Please retry.' USING ERRCODE = '23503';
  END IF;

  INSERT INTO public.birthday_profiles (user_id, party_theme)
  VALUES (v_uid, _theme)
  ON CONFLICT (user_id) DO UPDATE SET party_theme = EXCLUDED.party_theme;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.birthday_save_my_party_theme(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.birthday_save_my_party_theme(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.birthday_my_badges()
RETURNS TABLE (badge_key text, awarded_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT a.badge_key, a.awarded_at
  FROM public.birthday_achievements AS a
  WHERE a.user_id = auth.uid()
  ORDER BY a.awarded_at, a.badge_key;
$$;
REVOKE ALL ON FUNCTION public.birthday_my_badges() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.birthday_my_badges() TO authenticated;

CREATE OR REPLACE FUNCTION public.birthday_record_activity(_activity text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_badge_key text;
  v_inserted integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in to collect birthday keepsakes.' USING ERRCODE = '28000';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM auth.users AS u
    LEFT JOIN public.profiles AS p ON p.id = u.id
    WHERE u.id = v_uid
      AND (u.is_anonymous IS TRUE OR p.is_guest IS TRUE)
  ) THEN
    RETURN false;
  END IF;

  v_badge_key := CASE _activity
    WHEN 'balloon_pop' THEN 'balloon_friend'
    WHEN 'gift_open' THEN 'gift_opener'
    WHEN 'cake_cut' THEN 'cake_cutter'
    WHEN 'fireworks' THEN 'firework_captain'
    WHEN 'letter_open' THEN 'letter_keeper'
    WHEN 'capsule_open' THEN 'capsule_finder'
    WHEN 'magic_wand' THEN 'sparkle_caster'
    WHEN 'grand_finale' THEN 'finale_star'
    WHEN 'memory_card_saved' THEN 'memory_maker'
    ELSE NULL
  END;
  IF v_badge_key IS NULL THEN
    RAISE EXCEPTION 'Unknown birthday activity.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.birthday_achievements (user_id, badge_key)
  VALUES (v_uid, v_badge_key)
  ON CONFLICT (user_id, badge_key) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.birthday_record_activity(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.birthday_record_activity(text) TO authenticated;

-- A real wish insert, not a client claim, earns the wish-giver badge.
CREATE OR REPLACE FUNCTION public.birthday_award_wish_giver_badge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM auth.users AS u
    LEFT JOIN public.profiles AS p ON p.id = u.id
    WHERE u.id = NEW.sender_id
      AND (u.is_anonymous IS TRUE OR p.is_guest IS TRUE)
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.birthday_achievements (user_id, badge_key)
  VALUES (NEW.sender_id, 'wish_giver')
  ON CONFLICT (user_id, badge_key) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.birthday_award_wish_giver_badge() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS birthday_wish_giver_badge_after_insert ON public.birthday_wishes;
CREATE TRIGGER birthday_wish_giver_badge_after_insert
AFTER INSERT ON public.birthday_wishes
FOR EACH ROW EXECUTE FUNCTION public.birthday_award_wish_giver_badge();

COMMIT;
