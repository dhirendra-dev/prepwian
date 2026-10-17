-- Additive Lecture Command Center support. Existing lecture rows and RLS policies remain intact.
ALTER TABLE public.jee_lecture_tracker
  ADD COLUMN IF NOT EXISTS chapter text,
  ADD COLUMN IF NOT EXISTS teacher text,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.jee_lecture_tracker'::regclass
      AND conname = 'jee_lecture_tracker_priority_check'
  ) THEN
    ALTER TABLE public.jee_lecture_tracker
      ADD CONSTRAINT jee_lecture_tracker_priority_check
      CHECK (priority IN ('low', 'medium', 'high'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.jee_lecture_command_center_list(
  _search text DEFAULT NULL,
  _subject text DEFAULT NULL,
  _status text DEFAULT NULL,
  _priority text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  subject text,
  title text,
  chapter text,
  teacher text,
  duration_minutes integer,
  watched_minutes integer,
  status text,
  planned_for date,
  lecture_url text,
  source text,
  notes text,
  priority text,
  completed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  RETURN QUERY
  SELECT l.id, l.subject, l.title, l.chapter, l.teacher,
         l.duration_minutes, l.watched_minutes, l.status, l.planned_for,
         l.lecture_url, l.source, l.notes, l.priority, l.completed_at,
         l.created_at, l.updated_at
  FROM public.jee_lecture_tracker AS l
  WHERE l.user_id = v_user_id
    AND (_subject IS NULL OR l.subject = upper(trim(_subject)))
    AND (_status IS NULL OR l.status = upper(trim(_status)))
    AND (_priority IS NULL OR l.priority = lower(trim(_priority)))
    AND (
      nullif(trim(_search), '') IS NULL
      OR l.title ILIKE '%' || trim(_search) || '%'
      OR coalesce(l.chapter, '') ILIKE '%' || trim(_search) || '%'
      OR coalesce(l.teacher, '') ILIKE '%' || trim(_search) || '%'
      OR coalesce(l.source, '') ILIKE '%' || trim(_search) || '%'
    )
  ORDER BY l.planned_for ASC NULLS LAST, l.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.jee_lecture_command_center_save(
  _lecture_id uuid,
  _subject text,
  _title text,
  _chapter text,
  _teacher text,
  _duration_minutes integer,
  _lecture_url text,
  _planned_for date,
  _notes text,
  _priority text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_subject text := upper(trim(coalesce(_subject, '')));
  v_priority text := lower(trim(coalesce(_priority, 'medium')));
  v_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  IF length(trim(coalesce(_title, ''))) NOT BETWEEN 1 AND 180 THEN
    RAISE EXCEPTION 'Lecture title must be between 1 and 180 characters' USING ERRCODE = '22023';
  END IF;
  IF v_subject NOT IN ('PHYSICS', 'CHEMISTRY', 'MATHEMATICS') THEN
    RAISE EXCEPTION 'Choose a supported JEE subject' USING ERRCODE = '22023';
  END IF;
  IF _duration_minutes IS NULL OR _duration_minutes NOT BETWEEN 1 AND 600 THEN
    RAISE EXCEPTION 'Duration must be between 1 and 600 minutes' USING ERRCODE = '22023';
  END IF;
  IF v_priority NOT IN ('low', 'medium', 'high') THEN
    RAISE EXCEPTION 'Choose a valid priority' USING ERRCODE = '22023';
  END IF;
  IF length(coalesce(_chapter, '')) > 160 OR length(coalesce(_teacher, '')) > 120
     OR length(coalesce(_notes, '')) > 4000 OR length(coalesce(_lecture_url, '')) > 2048 THEN
    RAISE EXCEPTION 'One or more lecture fields are too long' USING ERRCODE = '22023';
  END IF;
  IF nullif(trim(coalesce(_lecture_url, '')), '') IS NOT NULL
     AND trim(_lecture_url) !~* '^https?://' THEN
    RAISE EXCEPTION 'Lecture URL must use http or https' USING ERRCODE = '22023';
  END IF;

  IF _lecture_id IS NULL THEN
    INSERT INTO public.jee_lecture_tracker (
      user_id, subject, title, chapter, teacher, duration_minutes,
      watched_minutes, status, lecture_url, source, planned_for, notes, priority
    ) VALUES (
      v_user_id, v_subject, trim(_title), nullif(trim(coalesce(_chapter, '')), ''),
      nullif(trim(coalesce(_teacher, '')), ''), _duration_minutes, 0, 'PENDING',
      nullif(trim(coalesce(_lecture_url, '')), ''), null,
      _planned_for, nullif(trim(coalesce(_notes, '')), ''), v_priority
    ) RETURNING id INTO v_id;
  ELSE
    UPDATE public.jee_lecture_tracker AS l
    SET subject = v_subject,
        title = trim(_title),
        chapter = nullif(trim(coalesce(_chapter, '')), ''),
        teacher = nullif(trim(coalesce(_teacher, '')), ''),
        duration_minutes = _duration_minutes,
        lecture_url = nullif(trim(coalesce(_lecture_url, '')), ''),
        planned_for = _planned_for,
        notes = nullif(trim(coalesce(_notes, '')), ''),
        priority = v_priority,
        watched_minutes = least(l.watched_minutes, _duration_minutes),
        status = CASE
          WHEN l.status = 'COMPLETED' AND l.watched_minutes >= _duration_minutes THEN 'COMPLETED'
          WHEN l.status = 'COMPLETED' THEN 'IN_PROGRESS'
          ELSE l.status
        END,
        completed_at = CASE
          WHEN l.status = 'COMPLETED' AND l.watched_minutes >= _duration_minutes THEN l.completed_at
          ELSE NULL
        END,
        updated_at = now()
    WHERE l.id = _lecture_id AND l.user_id = v_user_id
    RETURNING l.id INTO v_id;
    IF v_id IS NULL THEN
      RAISE EXCEPTION 'Lecture not found' USING ERRCODE = 'P0002';
    END IF;
  END IF;

  RETURN jsonb_build_object('id', v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.jee_lecture_command_center_progress(
  _lecture_id uuid,
  _watched_minutes integer,
  _status text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_duration integer;
  v_watched integer;
  v_status text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  SELECT duration_minutes INTO v_duration
  FROM public.jee_lecture_tracker
  WHERE id = _lecture_id AND user_id = v_user_id;
  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'Lecture not found' USING ERRCODE = 'P0002';
  END IF;
  IF _watched_minutes IS NULL OR _watched_minutes < 0 THEN
    RAISE EXCEPTION 'Progress must be zero or greater' USING ERRCODE = '22023';
  END IF;
  v_watched := least(_watched_minutes, v_duration);
  v_status := coalesce(nullif(upper(trim(_status)), ''),
    CASE WHEN v_watched >= v_duration THEN 'COMPLETED'
         WHEN v_watched > 0 THEN 'IN_PROGRESS'
         ELSE 'PENDING' END);
  IF v_status NOT IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED') THEN
    RAISE EXCEPTION 'Choose a valid lecture status' USING ERRCODE = '22023';
  END IF;
  IF v_status = 'COMPLETED' THEN v_watched := v_duration; END IF;
  IF v_status = 'PENDING' THEN v_watched := 0; END IF;

  UPDATE public.jee_lecture_tracker
  SET watched_minutes = v_watched,
      status = v_status,
      completed_at = CASE WHEN v_status = 'COMPLETED' THEN coalesce(completed_at, now()) ELSE NULL END,
      updated_at = now()
  WHERE id = _lecture_id AND user_id = v_user_id;

  RETURN jsonb_build_object('id', _lecture_id, 'watched_minutes', v_watched, 'status', v_status);
END;
$$;

CREATE OR REPLACE FUNCTION public.jee_lecture_command_center_delete(_lecture_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  DELETE FROM public.jee_lecture_tracker
  WHERE id = _lecture_id AND user_id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lecture not found' USING ERRCODE = 'P0002';
  END IF;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.jee_lecture_command_center_list(text, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.jee_lecture_command_center_save(uuid, text, text, text, text, integer, text, date, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.jee_lecture_command_center_progress(uuid, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.jee_lecture_command_center_delete(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.jee_lecture_command_center_list(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.jee_lecture_command_center_save(uuid, text, text, text, text, integer, text, date, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.jee_lecture_command_center_progress(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.jee_lecture_command_center_delete(uuid) TO authenticated;


-- Per-user planner preference for the daily lecture target.
CREATE TABLE IF NOT EXISTS public.jee_lecture_tracker_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_target integer NOT NULL DEFAULT 3 CHECK (daily_target BETWEEN 1 AND 12),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.jee_lecture_tracker_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.jee_lecture_tracker_preferences FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.jee_lecture_command_center_get_preferences()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_target integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  SELECT daily_target INTO v_target
  FROM public.jee_lecture_tracker_preferences
  WHERE user_id = v_user_id;
  RETURN coalesce(v_target, 3);
END;
$$;

CREATE OR REPLACE FUNCTION public.jee_lecture_command_center_set_preferences(_daily_target integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  IF _daily_target IS NULL OR _daily_target NOT BETWEEN 1 AND 12 THEN
    RAISE EXCEPTION 'Daily target must be between 1 and 12 lectures' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.jee_lecture_tracker_preferences (user_id, daily_target, updated_at)
  VALUES (v_user_id, _daily_target, now())
  ON CONFLICT (user_id) DO UPDATE
  SET daily_target = excluded.daily_target, updated_at = now();
  RETURN _daily_target;
END;
$$;

REVOKE ALL ON FUNCTION public.jee_lecture_command_center_get_preferences() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.jee_lecture_command_center_set_preferences(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.jee_lecture_command_center_get_preferences() TO authenticated;
GRANT EXECUTE ON FUNCTION public.jee_lecture_command_center_set_preferences(integer) TO authenticated;
