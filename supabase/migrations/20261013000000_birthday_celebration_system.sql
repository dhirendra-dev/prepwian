-- Birthday celebration system. Birthday data is isolated from profiles so that the
-- existing broad profile SELECT grant can never expose a full date of birth.
CREATE TABLE IF NOT EXISTS public.birthday_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  date_of_birth date,
  visibility text NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'community', 'public')),
  notifications_enabled boolean NOT NULL DEFAULT true,
  music_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT birthday_profiles_dob_floor CHECK (date_of_birth IS NULL OR date_of_birth >= DATE '1900-01-01')
);

CREATE TABLE IF NOT EXISTS public.birthday_wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  celebration_year integer NOT NULL CHECK (celebration_year BETWEEN 2000 AND 2200),
  message text NOT NULL CHECK (char_length(message) BETWEEN 2 AND 280),
  reaction text NOT NULL DEFAULT '🎉'
    CHECK (reaction IN ('🎉', '💛', '✨', '🔥', '🌟')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT birthday_wishes_not_self CHECK (sender_id <> recipient_id),
  CONSTRAINT birthday_wishes_one_per_year UNIQUE (sender_id, recipient_id, celebration_year)
);
CREATE INDEX IF NOT EXISTS birthday_wishes_recipient_created_idx
  ON public.birthday_wishes (recipient_id, celebration_year, created_at DESC);

CREATE TABLE IF NOT EXISTS public.birthday_wish_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id uuid NOT NULL REFERENCES public.birthday_wishes(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 240),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT birthday_wish_reports_once UNIQUE (wish_id, reporter_id)
);

ALTER TABLE public.birthday_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birthday_wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birthday_wish_reports ENABLE ROW LEVEL SECURITY;

-- No direct table access is granted to browser roles. Access is through the
-- SECURITY DEFINER RPCs below, which validate auth.uid() and visibility.
REVOKE ALL ON public.birthday_profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.birthday_wishes FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.birthday_wish_reports FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.birthday_profiles TO service_role;
GRANT ALL ON public.birthday_wishes TO service_role;
GRANT ALL ON public.birthday_wish_reports TO service_role;

CREATE OR REPLACE FUNCTION public.birthday_my_settings()
RETURNS TABLE (
  date_of_birth date,
  visibility text,
  notifications_enabled boolean,
  music_enabled boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bp.date_of_birth,
         COALESCE(bp.visibility, 'private'),
         COALESCE(bp.notifications_enabled, true),
         COALESCE(bp.music_enabled, true)
  FROM (SELECT auth.uid() AS uid) AS caller
  LEFT JOIN public.birthday_profiles AS bp ON bp.user_id = caller.uid
  WHERE caller.uid IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.birthday_my_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.birthday_my_settings() TO authenticated;

CREATE OR REPLACE FUNCTION public.birthday_save_my_settings(
  _date_of_birth date,
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
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in to update birthday settings.' USING ERRCODE = '28000'; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_uid AND p.is_guest IS TRUE) THEN RAISE EXCEPTION 'Create a full account to save birthday settings.' USING ERRCODE = '42501'; END IF;
  IF _visibility IS NULL OR _visibility NOT IN ('private', 'community', 'public') THEN RAISE EXCEPTION 'Invalid birthday visibility.' USING ERRCODE = '22023'; END IF;
  IF _date_of_birth IS NOT NULL AND (_date_of_birth < DATE '1900-01-01' OR _date_of_birth > v_today) THEN
    RAISE EXCEPTION 'Enter a valid date of birth.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.birthday_profiles (user_id, date_of_birth, visibility, notifications_enabled, music_enabled, updated_at)
  VALUES (v_uid, _date_of_birth, _visibility, COALESCE(_notifications_enabled, true), COALESCE(_music_enabled, true), now())
  ON CONFLICT (user_id) DO UPDATE SET
    date_of_birth = EXCLUDED.date_of_birth,
    visibility = EXCLUDED.visibility,
    notifications_enabled = EXCLUDED.notifications_enabled,
    music_enabled = EXCLUDED.music_enabled,
    updated_at = now();
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.birthday_save_my_settings(date, text, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.birthday_save_my_settings(date, text, boolean, boolean) TO authenticated;

-- Returns only an anniversary date (with the current/upcoming year), never the
-- user's birth year. Asia/Kolkata is the configured JEE Prep Hub timezone.
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
           EXTRACT(month FROM bp.date_of_birth)::integer AS m,
           EXTRACT(day FROM bp.date_of_birth)::integer AS dy,
           t.d AS today
    FROM public.birthday_profiles bp
    JOIN public.public_profiles pp ON pp.id = bp.user_id
    CROSS JOIN today t
    WHERE bp.date_of_birth IS NOT NULL
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
  v_year integer := EXTRACT(year FROM (now() AT TIME ZONE 'Asia/Kolkata'))::integer;
BEGIN
  SELECT bp.visibility INTO v_visibility
  FROM public.birthday_profiles bp
  WHERE bp.user_id = _recipient_id AND bp.date_of_birth IS NOT NULL;
  IF v_visibility IS NULL OR (v_visibility = 'private' AND v_uid IS DISTINCT FROM _recipient_id)
     OR (v_visibility = 'community' AND v_uid IS NULL) THEN
    RAISE EXCEPTION 'This birthday wish wall is not available.' USING ERRCODE = '42501';
  END IF;

  WITH today AS (
    SELECT (now() AT TIME ZONE 'Asia/Kolkata')::date AS d,
           EXTRACT(year FROM now() AT TIME ZONE 'Asia/Kolkata')::integer AS y
  ), parts AS (
    SELECT t.d, t.y,
           EXTRACT(month FROM bp.date_of_birth)::integer AS m,
           EXTRACT(day FROM bp.date_of_birth)::integer AS dy
    FROM public.birthday_profiles bp CROSS JOIN today t
    WHERE bp.user_id = _recipient_id AND bp.date_of_birth IS NOT NULL
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
  v_date date;
  v_year integer;
  v_wish_id uuid;
  v_message text := trim(COALESCE(_message, ''));
  v_reaction text := COALESCE(_reaction, '🎉');
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in to send a birthday wish.' USING ERRCODE = '28000'; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_uid AND p.is_guest IS TRUE) THEN RAISE EXCEPTION 'Create a full account to send birthday wishes.' USING ERRCODE = '42501'; END IF;
  IF _recipient_id = v_uid THEN RAISE EXCEPTION 'You cannot send a wish to yourself.' USING ERRCODE = '22023'; END IF;
  IF char_length(v_message) < 2 OR char_length(v_message) > 280 THEN RAISE EXCEPTION 'A wish must be 2–280 characters.' USING ERRCODE = '22023'; END IF;
  IF v_reaction NOT IN ('🎉', '💛', '✨', '🔥', '🌟') THEN RAISE EXCEPTION 'Choose a valid reaction.' USING ERRCODE = '22023'; END IF;

  SELECT bp.visibility, bp.notifications_enabled,
         COALESCE(NULLIF(trim(pp.full_name), ''), NULLIF(trim(pp.username), ''), 'Aspirant')
    INTO v_visibility, v_notifications, v_name
  FROM public.birthday_profiles bp
  JOIN public.public_profiles pp ON pp.id = bp.user_id
  WHERE bp.user_id = _recipient_id AND bp.date_of_birth IS NOT NULL;
  IF v_visibility IS NULL OR v_visibility = 'private' THEN RAISE EXCEPTION 'This person is not accepting community birthday wishes.' USING ERRCODE = '42501'; END IF;

  WITH cycle AS (
    SELECT EXTRACT(year FROM v_today)::integer AS y,
           EXTRACT(month FROM bp.date_of_birth)::integer AS m,
           EXTRACT(day FROM bp.date_of_birth)::integer AS dy
    FROM public.birthday_profiles bp WHERE bp.user_id = _recipient_id
  ), dates AS (
    SELECT make_date(y, m, LEAST(dy, EXTRACT(day FROM (date_trunc('month', make_date(y, m, 1)) + interval '1 month - 1 day'))::integer)) AS d,
           y, m, dy FROM cycle
  )
  SELECT CASE WHEN d < v_today
       THEN make_date(y + 1, m, LEAST(dy, EXTRACT(day FROM (date_trunc('month', make_date(y + 1, m, 1)) + interval '1 month - 1 day'))::integer))
       ELSE d END
    INTO v_date FROM dates;
  IF v_date IS NULL OR v_date > v_today + 30 THEN RAISE EXCEPTION 'Birthday wishes open during the 30 days before a birthday.' USING ERRCODE = '22023'; END IF;
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

CREATE OR REPLACE FUNCTION public.birthday_report_wish(_wish_id uuid, _reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in to report a wish.' USING ERRCODE = '28000'; END IF;
  IF char_length(trim(COALESCE(_reason, ''))) NOT BETWEEN 3 AND 240 THEN RAISE EXCEPTION 'Please provide a short reason.' USING ERRCODE = '22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.birthday_wishes WHERE id = _wish_id AND sender_id <> v_uid) THEN
    RAISE EXCEPTION 'This wish cannot be reported.' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.birthday_wish_reports (wish_id, reporter_id, reason)
  VALUES (_wish_id, v_uid, trim(_reason))
  ON CONFLICT (wish_id, reporter_id) DO NOTHING;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.birthday_report_wish(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.birthday_report_wish(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.birthday_delete_wish(_wish_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in to delete a wish.' USING ERRCODE = '28000'; END IF;
  DELETE FROM public.birthday_wishes w
  WHERE w.id = _wish_id
    AND (w.sender_id = v_uid OR w.recipient_id = v_uid OR public.has_role(v_uid, 'admin'));
  IF NOT FOUND THEN RAISE EXCEPTION 'Wish not found or you do not have permission to delete it.' USING ERRCODE = '42501'; END IF;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.birthday_delete_wish(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.birthday_delete_wish(uuid) TO authenticated;


CREATE OR REPLACE FUNCTION public.birthday_moderation_queue(_limit integer DEFAULT 50)
RETURNS TABLE (
  report_id uuid,
  wish_id uuid,
  reporter_id uuid,
  reporter_name text,
  sender_id uuid,
  sender_name text,
  recipient_id uuid,
  message text,
  reason text,
  reported_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin') THEN
    RAISE EXCEPTION 'Administrator access required.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT r.id, w.id, r.reporter_id,
         COALESCE(NULLIF(trim(reporter.full_name), ''), NULLIF(trim(reporter.username), ''), 'Aspirant'),
         w.sender_id,
         COALESCE(NULLIF(trim(sender.full_name), ''), NULLIF(trim(sender.username), ''), 'Aspirant'),
         w.recipient_id, w.message, r.reason, r.created_at
  FROM public.birthday_wish_reports r
  JOIN public.birthday_wishes w ON w.id = r.wish_id
  LEFT JOIN public.public_profiles reporter ON reporter.id = r.reporter_id
  LEFT JOIN public.public_profiles sender ON sender.id = w.sender_id
  ORDER BY r.created_at ASC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 50), 1), 100);
END;
$$;
REVOKE ALL ON FUNCTION public.birthday_moderation_queue(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.birthday_moderation_queue(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.birthday_resolve_report(_report_id uuid, _delete_wish boolean DEFAULT false)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_wish_id uuid;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin') THEN
    RAISE EXCEPTION 'Administrator access required.' USING ERRCODE = '42501';
  END IF;
  SELECT r.wish_id INTO v_wish_id FROM public.birthday_wish_reports r WHERE r.id = _report_id;
  IF v_wish_id IS NULL THEN RAISE EXCEPTION 'Report not found.' USING ERRCODE = 'P0002'; END IF;
  IF COALESCE(_delete_wish, false) THEN
    DELETE FROM public.birthday_wishes WHERE id = v_wish_id;
  ELSE
    DELETE FROM public.birthday_wish_reports WHERE id = _report_id;
  END IF;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.birthday_resolve_report(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.birthday_resolve_report(uuid, boolean) TO authenticated;
