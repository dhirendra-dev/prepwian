-- PREPWIAN: original user-owned study data model
-- Fresh project migration. Does not depend on any other application's schema.
begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  active_exam text not null default 'JEE Main'
    check (active_exam in ('JEE Main', 'JEE Advanced', 'NEET UG', 'Other')),
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 140),
  plan_date date not null default current_date,
  objective text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.study_plans(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 240),
  subject text not null default 'General',
  estimated_minutes integer not null default 25 check (estimated_minutes between 1 and 1440),
  status text not null default 'todo' check (status in ('todo', 'doing', 'done', 'skipped')),
  due_date date not null default current_date,
  completed_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.concepts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  subject text not null default 'General',
  status text not null default 'unseen' check (status in ('unseen', 'learning', 'review', 'clear_for_now')),
  confidence smallint check (confidence between 1 and 5),
  next_review_on date,
  source_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reflection_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_date date not null default current_date,
  mood text not null default 'steady' check (mood in ('tough', 'steady', 'breakthrough')),
  body text not null check (char_length(trim(body)) between 1 and 8000),
  next_step text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resource_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 240),
  subject text not null default 'General',
  resource_type text not null default 'link' check (resource_type in ('link', 'book', 'pdf', 'video', 'note', 'other')),
  url text,
  description text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resource_url_scheme check (url is null or url ~* '^https?://')
);

create table if not exists public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_label text not null default 'Personal practice',
  subject text not null default 'General',
  topic text not null default '',
  question_ref text,
  is_correct boolean not null,
  time_spent_seconds integer check (time_spent_seconds between 0 and 86400),
  attempted_at timestamptz not null default now()
);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'focus' check (mode in ('focus', 'short_break', 'long_break')),
  planned_seconds integer not null check (planned_seconds between 1 and 86400),
  elapsed_seconds integer not null default 0 check (elapsed_seconds between 0 and planned_seconds),
  completed boolean not null default false,
  subject text not null default 'General',
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists study_plans_user_date_idx on public.study_plans(user_id, plan_date desc);
create index if not exists study_tasks_user_due_idx on public.study_tasks(user_id, due_date, status);
create index if not exists concepts_user_subject_idx on public.concepts(user_id, subject, status);
create index if not exists reflections_user_date_idx on public.reflection_notes(user_id, session_date desc);
create index if not exists resources_user_subject_idx on public.resource_entries(user_id, subject);
create index if not exists attempts_user_time_idx on public.practice_attempts(user_id, attempted_at desc);
create index if not exists focus_user_time_idx on public.focus_sessions(user_id, started_at desc);

create or replace function public.prepwian_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare tbl text;
begin
  foreach tbl in array array['profiles','study_plans','study_tasks','concepts','reflection_notes','resource_entries']
  loop
    execute format('drop trigger if exists %I on public.%I', tbl || '_updated_at', tbl);
    execute format('create trigger %I before update on public.%I for each row execute function public.prepwian_set_updated_at()', tbl || '_updated_at', tbl);
  end loop;
end;
$$;

create or replace function public.prepwian_create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists prepwian_auth_user_created on auth.users;
create trigger prepwian_auth_user_created
  after insert on auth.users
  for each row execute function public.prepwian_create_profile();

alter table public.profiles enable row level security;
alter table public.study_plans enable row level security;
alter table public.study_tasks enable row level security;
alter table public.concepts enable row level security;
alter table public.reflection_notes enable row level security;
alter table public.resource_entries enable row level security;
alter table public.practice_attempts enable row level security;
alter table public.focus_sessions enable row level security;

-- Recreate named policies safely if this migration is re-run.
drop policy if exists "profile_select_own" on public.profiles;
create policy "profile_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "profile_insert_own" on public.profiles;
create policy "profile_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "profile_update_own" on public.profiles;
create policy "profile_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "study_plans_own" on public.study_plans;
create policy "study_plans_own" on public.study_plans for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "study_tasks_own" on public.study_tasks;
create policy "study_tasks_own" on public.study_tasks for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "concepts_own" on public.concepts;
create policy "concepts_own" on public.concepts for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "reflection_notes_own" on public.reflection_notes;
create policy "reflection_notes_own" on public.reflection_notes for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "resource_entries_own" on public.resource_entries;
create policy "resource_entries_own" on public.resource_entries for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "practice_attempts_own" on public.practice_attempts;
create policy "practice_attempts_own" on public.practice_attempts for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "focus_sessions_own" on public.focus_sessions;
create policy "focus_sessions_own" on public.focus_sessions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.study_plans to authenticated;
grant select, insert, update, delete on public.study_tasks to authenticated;
grant select, insert, update, delete on public.concepts to authenticated;
grant select, insert, update, delete on public.reflection_notes to authenticated;
grant select, insert, update, delete on public.resource_entries to authenticated;
grant select, insert, update, delete on public.practice_attempts to authenticated;
grant select, insert, update, delete on public.focus_sessions to authenticated;
grant select, insert, update on public.profiles to authenticated;

commit;
