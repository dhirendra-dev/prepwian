BEGIN;

-- Remove the old recurring job if the previous migration was already applied.
-- Dynamic SQL lets this cleanup safely no-op when pg_cron is not installed.
DO $$
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    EXECUTE $unschedule$
      SELECT cron.unschedule(jobid)
      FROM cron.job
      WHERE jobname = 'birthday_upcoming_reminders'
    $unschedule$;
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.birthday_deliver_upcoming_reminders();
REVOKE ALL ON public.birthday_reminder_deliveries FROM PUBLIC, anon, authenticated, service_role;

-- This RPC runs only when the authenticated user's app session calls it.
-- It reuses the Birthday Hub visibility rules, and its private ledger prevents
-- duplicate notifications if multiple tabs call it at the same time.
CREATE OR REPLACE FUNCTION public.birthday_generate_my_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_days_before integer;
  v_created integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in to check birthday reminders.' USING ERRCODE = '28000';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM auth.users AS au
    LEFT JOIN public.profiles AS p ON p.id = au.id
    WHERE au.id = v_uid
      AND (au.is_anonymous IS TRUE OR p.is_guest IS TRUE)
  ) THEN
    RETURN 0;
  END IF;

  SELECT bp.birthday_reminder_days_before::integer
  INTO v_days_before
  FROM public.birthday_profiles AS bp
  WHERE bp.user_id = v_uid
    AND bp.birthday_reminders_enabled IS TRUE
    AND bp.birthday_month IS NOT NULL
    AND bp.birthday_day IS NOT NULL;

  IF v_days_before IS NULL OR v_days_before NOT IN (1, 3, 7) THEN
    RETURN 0;
  END IF;

  WITH due AS (
    SELECT h.user_id AS birthday_user_id,
           h.display_name,
           h.birthday_on,
           h.days_until,
           EXTRACT(year FROM h.birthday_on)::integer AS birthday_year
    FROM public.birthday_hub(v_days_before) AS h
    JOIN public.profiles AS p ON p.id = h.user_id
    JOIN auth.users AS au ON au.id = h.user_id
    WHERE h.user_id <> v_uid
      AND h.days_until BETWEEN 0 AND v_days_before
      AND p.is_guest IS NOT TRUE
      AND au.is_anonymous IS NOT TRUE
  ), claimed AS (
    INSERT INTO public.birthday_reminder_deliveries (
      recipient_id, birthday_user_id, birthday_year, days_before
    )
    SELECT v_uid, d.birthday_user_id, d.birthday_year, v_days_before::smallint
    FROM due AS d
    ON CONFLICT (recipient_id, birthday_user_id, birthday_year) DO NOTHING
    RETURNING birthday_user_id, birthday_year
  )
  INSERT INTO public.notifications (
    title, body, link, audience, target_user_id, created_by
  )
  SELECT
    'Birthday coming up',
    format(
      '%s has a birthday %s. Send them a wish on the Birthday Hub.',
      d.display_name,
      CASE d.days_until
        WHEN 0 THEN 'today'
        WHEN 1 THEN 'tomorrow'
        ELSE format('in %s days', d.days_until)
      END
    ),
    '/birthday?user=' || d.birthday_user_id::text,
    'user',
    v_uid,
    NULL
  FROM claimed AS c
  JOIN due AS d
    ON d.birthday_user_id = c.birthday_user_id
   AND d.birthday_year = c.birthday_year;

  GET DIAGNOSTICS v_created = ROW_COUNT;
  RETURN v_created;
END;
$$;

REVOKE ALL ON FUNCTION public.birthday_generate_my_reminders() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.birthday_generate_my_reminders() TO authenticated;

COMMIT;
