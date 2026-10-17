BEGIN;

-- A separate preference controls reminders about visible classmates. The existing
-- notifications_enabled flag remains dedicated to incoming birthday wishes.
ALTER TABLE public.birthday_profiles
  ADD COLUMN IF NOT EXISTS birthday_reminders_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS birthday_reminder_days_before smallint NOT NULL DEFAULT 1;

ALTER TABLE public.birthday_profiles
  DROP CONSTRAINT IF EXISTS birthday_profiles_reminder_lead_check;
ALTER TABLE public.birthday_profiles
  ADD CONSTRAINT birthday_profiles_reminder_lead_check
  CHECK (birthday_reminder_days_before IN (1, 3, 7));

-- This private ledger makes the on-demand check idempotent: each recipient gets at
-- most one reminder for a classmate's birthday in a given birthday year.
CREATE TABLE IF NOT EXISTS public.birthday_reminder_deliveries (
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  birthday_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  birthday_year integer NOT NULL CHECK (birthday_year BETWEEN 2000 AND 2200),
  days_before smallint NOT NULL CHECK (days_before IN (1, 3, 7)),
  sent_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT birthday_reminder_deliveries_once_per_year
    PRIMARY KEY (recipient_id, birthday_user_id, birthday_year),
  CONSTRAINT birthday_reminder_deliveries_not_self
    CHECK (recipient_id <> birthday_user_id)
);
CREATE INDEX IF NOT EXISTS birthday_reminder_deliveries_recipient_sent_idx
  ON public.birthday_reminder_deliveries (recipient_id, sent_at DESC);
ALTER TABLE public.birthday_reminder_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.birthday_reminder_deliveries FROM PUBLIC, anon, authenticated, service_role;

-- Extend the existing own-settings RPC; browser callers still cannot read the
-- private birthday_profiles table directly.
DROP FUNCTION IF EXISTS public.birthday_my_settings();
CREATE FUNCTION public.birthday_my_settings()
RETURNS TABLE (
  birthday_month smallint,
  birthday_day smallint,
  visibility text,
  notifications_enabled boolean,
  birthday_reminders_enabled boolean,
  birthday_reminder_days_before smallint,
  music_enabled boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT bp.birthday_month,
         bp.birthday_day,
         COALESCE(bp.visibility, 'private'),
         COALESCE(bp.notifications_enabled, true),
         COALESCE(bp.birthday_reminders_enabled, true),
         COALESCE(bp.birthday_reminder_days_before, 1),
         COALESCE(bp.music_enabled, true)
  FROM (SELECT auth.uid() AS uid) AS caller
  LEFT JOIN public.birthday_profiles AS bp ON bp.user_id = caller.uid
  WHERE caller.uid IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.birthday_my_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.birthday_my_settings() TO authenticated;

DROP FUNCTION IF EXISTS public.birthday_save_my_settings(integer, integer, text, boolean, boolean);
DROP FUNCTION IF EXISTS public.birthday_save_my_settings(integer, integer, text, boolean, boolean, boolean, integer);
CREATE FUNCTION public.birthday_save_my_settings(
  _birthday_month integer,
  _birthday_day integer,
  _visibility text,
  _notifications_enabled boolean,
  _music_enabled boolean,
  _birthday_reminders_enabled boolean DEFAULT true,
  _birthday_reminder_days_before integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_max_day integer;
  v_reminder_days integer := COALESCE(_birthday_reminder_days_before, 1);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in to save your birthday.' USING ERRCODE = '28000';
  END IF;
  IF _birthday_month IS NULL OR _birthday_month NOT BETWEEN 1 AND 12 THEN
    RAISE EXCEPTION 'Choose a valid birthday month.' USING ERRCODE = '22023';
  END IF;
  v_max_day := CASE
    WHEN _birthday_month = 2 THEN 29
    WHEN _birthday_month IN (4, 6, 9, 11) THEN 30
    ELSE 31
  END;
  IF _birthday_day IS NULL OR _birthday_day NOT BETWEEN 1 AND v_max_day THEN
    RAISE EXCEPTION 'Choose a valid day for the selected month.' USING ERRCODE = '22023';
  END IF;
  IF _visibility IS NULL OR _visibility NOT IN ('private', 'community', 'public') THEN
    RAISE EXCEPTION 'Invalid birthday visibility.' USING ERRCODE = '22023';
  END IF;
  IF v_reminder_days NOT IN (1, 3, 7) THEN
    RAISE EXCEPTION 'Choose a reminder lead time of 1, 3, or 7 days.' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_uid) THEN
    INSERT INTO public.profiles (id, full_name, avatar_url, is_guest)
    SELECT u.id,
           COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''),
                    NULLIF(u.raw_user_meta_data->>'name', ''),
                    NULLIF(split_part(COALESCE(u.email, ''), '@', 1), ''),
                    CASE WHEN COALESCE(u.is_anonymous, false) THEN 'Guest Aspirant' END),
           u.raw_user_meta_data->>'avatar_url',
           COALESCE(u.is_anonymous, false)
    FROM auth.users u
    WHERE u.id = v_uid
    ON CONFLICT (id) DO NOTHING;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_uid) THEN
    RAISE EXCEPTION 'Your profile could not be prepared. Please retry or contact support.' USING ERRCODE = '23503';
  END IF;

  INSERT INTO public.birthday_profiles (
    user_id, birthday_month, birthday_day, visibility,
    notifications_enabled, music_enabled, birthday_reminders_enabled,
    birthday_reminder_days_before, updated_at
  )
  VALUES (
    v_uid, _birthday_month::smallint, _birthday_day::smallint, _visibility,
    COALESCE(_notifications_enabled, true), COALESCE(_music_enabled, true),
    COALESCE(_birthday_reminders_enabled, true), v_reminder_days::smallint, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    birthday_month = EXCLUDED.birthday_month,
    birthday_day = EXCLUDED.birthday_day,
    visibility = EXCLUDED.visibility,
    notifications_enabled = EXCLUDED.notifications_enabled,
    music_enabled = EXCLUDED.music_enabled,
    birthday_reminders_enabled = EXCLUDED.birthday_reminders_enabled,
    birthday_reminder_days_before = EXCLUDED.birthday_reminder_days_before,
    updated_at = now();
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.birthday_save_my_settings(integer, integer, text, boolean, boolean, boolean, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.birthday_save_my_settings(integer, integer, text, boolean, boolean, boolean, integer) TO authenticated;

-- Reminder delivery is performed only by an authenticated, on-demand RPC; this migration schedules no background work.

COMMIT;
