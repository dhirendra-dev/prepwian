BEGIN;

-- Evolve the existing private birthday table; do not create a parallel table.
ALTER TABLE public.birthday_profiles
  ADD COLUMN IF NOT EXISTS birthday_month smallint,
  ADD COLUMN IF NOT EXISTS birthday_day smallint;

-- Preserve existing records and backfill the fields used by the new yearless UI.
-- The legacy date remains private and untouched to avoid destructive data loss;
-- the replacement settings RPC below never returns or writes a birth year.
UPDATE public.birthday_profiles
SET birthday_month = EXTRACT(MONTH FROM date_of_birth)::smallint,
    birthday_day = EXTRACT(DAY FROM date_of_birth)::smallint
WHERE date_of_birth IS NOT NULL
  AND (birthday_month IS NULL OR birthday_day IS NULL);

-- Rows which had no birthday were never actually opted into discovery.
UPDATE public.birthday_profiles
SET visibility = 'private'
WHERE birthday_month IS NULL OR birthday_day IS NULL;

ALTER TABLE public.birthday_profiles
  ADD CONSTRAINT birthday_profiles_month_day_valid CHECK (
    (birthday_month IS NULL AND birthday_day IS NULL)
    OR (
      birthday_month IS NOT NULL
      AND birthday_day IS NOT NULL
      AND birthday_month BETWEEN 1 AND 12
      AND birthday_day BETWEEN 1 AND CASE
        WHEN birthday_month = 2 THEN 29
        WHEN birthday_month IN (4, 6, 9, 11) THEN 30
        ELSE 31
      END
    )
  );

-- Replace the old return shape: callers can only read month and day, never a year.
DROP FUNCTION IF EXISTS public.birthday_my_settings();
CREATE FUNCTION public.birthday_my_settings()
RETURNS TABLE (
  birthday_month smallint,
  birthday_day smallint,
  visibility text,
  notifications_enabled boolean,
  music_enabled boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bp.birthday_month,
         bp.birthday_day,
         COALESCE(bp.visibility, 'private'),
         COALESCE(bp.notifications_enabled, true),
         COALESCE(bp.music_enabled, true)
  FROM (SELECT auth.uid() AS uid) AS caller
  LEFT JOIN public.birthday_profiles AS bp ON bp.user_id = caller.uid
  WHERE caller.uid IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.birthday_my_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.birthday_my_settings() TO authenticated;

-- The only browser-write path remains an authenticated, own-account RPC.
-- A minimal profile row is created from auth metadata only if the signup trigger
-- did not create it; existing profile fields are never overwritten.
DROP FUNCTION IF EXISTS public.birthday_save_my_settings(date, text, boolean, boolean);
CREATE FUNCTION public.birthday_save_my_settings(
  _birthday_month integer,
  _birthday_day integer,
  _visibility text,
  _notifications_enabled boolean,
  _music_enabled boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_max_day integer;
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
    notifications_enabled, music_enabled, updated_at
  )
  VALUES (
    v_uid, _birthday_month::smallint, _birthday_day::smallint, _visibility,
    COALESCE(_notifications_enabled, true), COALESCE(_music_enabled, true), now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    birthday_month = EXCLUDED.birthday_month,
    birthday_day = EXCLUDED.birthday_day,
    visibility = EXCLUDED.visibility,
    notifications_enabled = EXCLUDED.notifications_enabled,
    music_enabled = EXCLUDED.music_enabled,
    updated_at = now();
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.birthday_save_my_settings(integer, integer, text, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.birthday_save_my_settings(integer, integer, text, boolean, boolean) TO authenticated;

-- Birthday Hub still returns the current/upcoming anniversary date, not the
-- saved month/day fields or any birth year. Leap-day dates use Feb 28 in
-- non-leap years, matching the app's previous anniversary behavior.
CREATE OR REPLACE FUNCTION public.birthday_hub(_days_ahead integer DEFAULT 30)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  birthday_on date,
  days_until integer,
  wish_count bigint,
  unique_wisher_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH today AS (
    SELECT (now() AT TIME ZONE 'Asia/Kolkata')::date AS d
  ), anniversary_base AS (
    SELECT bp.user_id,
           COALESCE(NULLIF(trim(pp.full_name), ''), NULLIF(trim(pp.username), ''), 'Aspirant') AS name,
           pp.avatar_url,
           bp.visibility,
           EXTRACT(year FROM t.d)::integer AS y,
           bp.birthday_month::integer AS m,
           bp.birthday_day::integer AS dy,
           t.d AS today
    FROM public.birthday_profiles bp
    JOIN public.public_profiles pp ON pp.id = bp.user_id
    CROSS JOIN today t
    WHERE bp.birthday_month IS NOT NULL
      AND bp.birthday_day IS NOT NULL
      AND bp.visibility <> 'private'
      AND (bp.visibility = 'public' OR auth.uid() IS NOT NULL)
  ), this_year AS (
    SELECT a.*,
      make_date(a.y, a.m, LEAST(a.dy, EXTRACT(day FROM (date_trunc('month', make_date(a.y, a.m, 1)) + interval '1 month - 1 day'))::integer)) AS this_birthday
    FROM anniversary_base a
  ), upcoming AS (
    SELECT y.user_id, y.name, y.avatar_url, y.today,
      CASE WHEN y.this_birthday < y.today THEN
        make_date(y.y + 1, y.m, LEAST(y.dy, EXTRACT(day FROM (date_trunc('month', make_date(y.y + 1, y.m, 1)) + interval '1 month - 1 day'))::integer))
      ELSE y.this_birthday END AS event_date
    FROM this_year y
  )
  SELECT u.user_id, u.name, u.avatar_url, u.event_date,
         (u.event_date - u.today)::integer,
         COUNT(w.id)::bigint,
         COUNT(DISTINCT w.sender_id)::bigint
  FROM upcoming u
  LEFT JOIN public.birthday_wishes w
    ON w.recipient_id = u.user_id
   AND w.celebration_year = EXTRACT(year FROM u.event_date)::integer
  WHERE u.event_date BETWEEN u.today AND u.today + LEAST(GREATEST(COALESCE(_days_ahead, 30), 0), 90)
  GROUP BY u.user_id, u.name, u.avatar_url, u.event_date, u.today
  ORDER BY u.event_date, u.name
  LIMIT 250;
$$;
REVOKE ALL ON FUNCTION public.birthday_hub(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.birthday_hub(integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.birthday_wish_wall(
  _recipient_id uuid,
  _limit integer DEFAULT 20,
  _offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  sender_id uuid,
  sender_name text,
  sender_avatar_url text,
  message text,
  reaction text,
  created_at timestamptz,
  wish_count bigint,
  unique_wisher_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_visibility text;
  v_year integer;
BEGIN
  SELECT bp.visibility INTO v_visibility
  FROM public.birthday_profiles bp
  WHERE bp.user_id = _recipient_id
    AND bp.birthday_month IS NOT NULL AND bp.birthday_day IS NOT NULL;
  IF v_visibility IS NULL OR (v_visibility = 'private' AND v_uid IS DISTINCT FROM _recipient_id)
     OR (v_visibility = 'community' AND v_uid IS NULL) THEN
    RAISE EXCEPTION 'This birthday wish wall is not available.' USING ERRCODE = '42501';
  END IF;

  WITH today AS (
    SELECT (now() AT TIME ZONE 'Asia/Kolkata')::date AS d,
           EXTRACT(year FROM now() AT TIME ZONE 'Asia/Kolkata')::integer AS y
  ), parts AS (
    SELECT t.d, t.y, bp.birthday_month::integer AS m, bp.birthday_day::integer AS dy
    FROM public.birthday_profiles bp CROSS JOIN today t
    WHERE bp.user_id = _recipient_id
      AND bp.birthday_month IS NOT NULL AND bp.birthday_day IS NOT NULL
  ), anniversary AS (
    SELECT p.d, p.y,
      make_date(p.y, p.m, LEAST(p.dy, EXTRACT(day FROM (date_trunc('month', make_date(p.y, p.m, 1)) + interval '1 month - 1 day'))::integer)) AS this_birthday
    FROM parts p
  )
  SELECT CASE WHEN a.this_birthday < a.d THEN a.y + 1 ELSE a.y END
    INTO v_year FROM anniversary a;

  RETURN QUERY
  WITH counts AS (
    SELECT COUNT(*)::bigint AS total, COUNT(DISTINCT w.sender_id)::bigint AS people
    FROM public.birthday_wishes w
    WHERE w.recipient_id = _recipient_id AND w.celebration_year = v_year
  )
  SELECT w.id, w.sender_id,
         COALESCE(NULLIF(trim(pp.full_name), ''), NULLIF(trim(pp.username), ''), 'Aspirant'),
         pp.avatar_url, w.message, w.reaction, w.created_at, c.total, c.people
  FROM public.birthday_wishes w
  JOIN public.public_profiles pp ON pp.id = w.sender_id
  CROSS JOIN counts c
  WHERE w.recipient_id = _recipient_id AND w.celebration_year = v_year
  ORDER BY w.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 20), 1), 50)
  OFFSET GREATEST(COALESCE(_offset, 0), 0);
END;
$$;
REVOKE ALL ON FUNCTION public.birthday_wish_wall(uuid, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.birthday_wish_wall(uuid, integer, integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.birthday_send_wish(
  _recipient_id uuid,
  _message text,
  _reaction text DEFAULT '🎉'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_name text;
  v_visibility text;
  v_notifications boolean;
  v_month integer;
  v_day integer;
  v_date date;
  v_year integer;
  v_wish_id uuid;
  v_message text := trim(COALESCE(_message, ''));
  v_reaction text := COALESCE(_reaction, '🎉');
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in to send a birthday wish.' USING ERRCODE = '28000'; END IF;
  IF EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v_uid AND COALESCE(u.is_anonymous, false))
     OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_uid AND p.is_guest IS TRUE) THEN
    RAISE EXCEPTION 'Create a full account to send birthday wishes.' USING ERRCODE = '42501';
  END IF;
  IF _recipient_id = v_uid THEN RAISE EXCEPTION 'You cannot send a wish to yourself.' USING ERRCODE = '22023'; END IF;
  IF char_length(v_message) < 2 OR char_length(v_message) > 280 THEN RAISE EXCEPTION 'A wish must be 2–280 characters.' USING ERRCODE = '22023'; END IF;
  IF v_reaction NOT IN ('🎉', '💛', '✨', '🔥', '🌟') THEN RAISE EXCEPTION 'Choose a valid reaction.' USING ERRCODE = '22023'; END IF;

  SELECT bp.visibility, bp.notifications_enabled,
         bp.birthday_month::integer, bp.birthday_day::integer,
         COALESCE(NULLIF(trim(pp.full_name), ''), NULLIF(trim(pp.username), ''), 'Aspirant')
    INTO v_visibility, v_notifications, v_month, v_day, v_name
  FROM public.birthday_profiles bp
  JOIN public.public_profiles pp ON pp.id = bp.user_id
  WHERE bp.user_id = _recipient_id
    AND bp.birthday_month IS NOT NULL AND bp.birthday_day IS NOT NULL;
  IF v_visibility IS NULL OR v_visibility = 'private' THEN
    RAISE EXCEPTION 'This person is not accepting community birthday wishes.' USING ERRCODE = '42501';
  END IF;

  WITH cycle AS (
    SELECT EXTRACT(year FROM v_today)::integer AS y, v_month AS m, v_day AS dy
  ), dates AS (
    SELECT make_date(y, m, LEAST(dy, EXTRACT(day FROM (date_trunc('month', make_date(y, m, 1)) + interval '1 month - 1 day'))::integer)) AS d,
           y, m, dy FROM cycle
  )
  SELECT CASE WHEN d < v_today
       THEN make_date(y + 1, m, LEAST(dy, EXTRACT(day FROM (date_trunc('month', make_date(y + 1, m, 1)) + interval '1 month - 1 day'))::integer))
       ELSE d END
    INTO v_date FROM dates;
  IF v_date IS NULL OR v_date > v_today + 30 THEN
    RAISE EXCEPTION 'Birthday wishes open during the 30 days before a birthday.' USING ERRCODE = '22023';
  END IF;
  v_year := EXTRACT(year FROM v_date)::integer;

  INSERT INTO public.birthday_wishes (sender_id, recipient_id, celebration_year, message, reaction)
  VALUES (v_uid, _recipient_id, v_year, v_message, v_reaction)
  RETURNING id INTO v_wish_id;

  IF COALESCE(v_notifications, true) THEN
    INSERT INTO public.notifications (title, body, link, audience, target_user_id, created_by)
    VALUES ('A birthday wish for you', 'Someone sent you a birthday wish. Open your Birthday Hub to read it.', '/birthday?user=' || _recipient_id::text, 'user', _recipient_id, v_uid);
  END IF;
  RETURN v_wish_id;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'You have already sent this person a birthday wish this year.' USING ERRCODE = '23505';
END;
$$;
REVOKE ALL ON FUNCTION public.birthday_send_wish(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.birthday_send_wish(uuid, text, text) TO authenticated;

COMMIT;
