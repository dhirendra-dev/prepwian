
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'student');
CREATE TYPE public.class_level AS ENUM ('class_11', 'class_12', 'dropper', 'both');
CREATE TYPE public.subject AS ENUM ('physics', 'chemistry', 'mathematics', 'general');
CREATE TYPE public.resource_type AS ENUM ('notes', 'module', 'pyq', 'test_series', 'book', 'short_notes', 'video', 'other');
CREATE TYPE public.session_type AS ENUM ('pomodoro', 'stopwatch');
CREATE TYPE public.progress_status AS ENUM ('not_started', 'in_progress', 'completed');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  bio text,
  class_level public.class_level DEFAULT 'class_11',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- MATERIALS
CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject public.subject NOT NULL,
  class_level public.class_level NOT NULL DEFAULT 'both',
  topic text,
  drive_url text NOT NULL,
  resource_type public.resource_type NOT NULL DEFAULT 'notes',
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view materials"
  ON public.materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert materials"
  ON public.materials FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update materials"
  ON public.materials FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete materials"
  ON public.materials FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX materials_subject_idx ON public.materials(subject);
CREATE INDEX materials_class_idx ON public.materials(class_level);

-- STUDY SESSIONS
CREATE TABLE public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_seconds integer NOT NULL CHECK (duration_seconds >= 0),
  session_type public.session_type NOT NULL DEFAULT 'pomodoro',
  subject public.subject,
  note text,
  ended_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_sessions TO authenticated;
GRANT ALL ON public.study_sessions TO service_role;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in can view study sessions for leaderboard"
  ON public.study_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert their own sessions"
  ON public.study_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own sessions"
  ON public.study_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX study_sessions_user_idx ON public.study_sessions(user_id, ended_at DESC);

-- TOPIC PROGRESS
CREATE TABLE public.topic_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject public.subject NOT NULL,
  topic text NOT NULL,
  status public.progress_status NOT NULL DEFAULT 'not_started',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, subject, topic)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topic_progress TO authenticated;
GRANT ALL ON public.topic_progress TO service_role;
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their own progress"
  ON public.topic_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert their own progress"
  ON public.topic_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own progress"
  ON public.topic_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete their own progress"
  ON public.topic_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FORUM THREADS
CREATE TABLE public.forum_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  subject public.subject NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_threads TO authenticated;
GRANT ALL ON public.forum_threads TO service_role;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in can view threads"
  ON public.forum_threads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create their own threads"
  ON public.forum_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own threads"
  ON public.forum_threads FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users or admins delete threads"
  ON public.forum_threads FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- FORUM REPLIES
CREATE TABLE public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_replies TO authenticated;
GRANT ALL ON public.forum_replies TO service_role;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in can view replies"
  ON public.forum_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create their own replies"
  ON public.forum_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own replies"
  ON public.forum_replies FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users or admins delete replies"
  ON public.forum_replies FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX forum_replies_thread_idx ON public.forum_replies(thread_id, created_at);

-- STUDY GROUPS
CREATE TABLE public.study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_groups TO authenticated;
GRANT ALL ON public.study_groups TO service_role;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in can view groups"
  ON public.study_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create groups"
  ON public.study_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update groups"
  ON public.study_groups FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners delete groups"
  ON public.study_groups FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE public.study_group_members (
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_group_members TO authenticated;
GRANT ALL ON public.study_group_members TO service_role;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in can view memberships"
  ON public.study_group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users join groups themselves"
  ON public.study_group_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users leave groups themselves"
  ON public.study_group_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER materials_touch BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER threads_touch BEFORE UPDATE ON public.forum_threads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student')
    ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
