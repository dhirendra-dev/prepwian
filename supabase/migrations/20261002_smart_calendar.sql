-- ============================================================
-- JEE Prep Hub - Smart Calendar
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- CALENDARS
-- ============================================================

create table if not exists public.smart_calendars (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  name text not null,
  description text,

  color text default '#6366f1',

  calendar_type text not null default 'personal'
    check (
      calendar_type in (
        'personal',
        'study',
        'exam',
        'google'
      )
    ),

  is_visible boolean not null default true,
  is_default boolean not null default false,

  external_provider text
    check (
      external_provider is null
      or external_provider in ('google')
    ),

  external_calendar_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists smart_calendars_user_id_idx
  on public.smart_calendars(user_id);

create index if not exists smart_calendars_external_idx
  on public.smart_calendars(
    user_id,
    external_provider,
    external_calendar_id
  );

-- ============================================================
-- EVENTS
-- ============================================================

create table if not exists public.smart_calendar_events (
  id uuid primary key default gen_random_uuid(),

  calendar_id uuid not null
    references public.smart_calendars(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  title text not null,
  description text,

  location text,

  event_type text not null default 'event'
    check (
      event_type in (
        'event',
        'study',
        'lecture',
        'test',
        'exam',
        'deadline',
        'holiday',
        'reminder',
        'meeting',
        'personal'
      )
    ),

  subject text,

  start_at timestamptz not null,
  end_at timestamptz not null,

  all_day boolean not null default false,

  timezone text default 'Asia/Kolkata',

  color text,

  -- Exam-specific information
  exam_name text,
  exam_organization text,
  exam_mode text,
  exam_level text,

  -- Recurrence
  recurrence_rule text,
  recurrence_until timestamptz,

  -- External provider information
  external_provider text
    check (
      external_provider is null
      or external_provider in ('google')
    ),

  external_event_id text,
  external_etag text,

  -- Sync bookkeeping
  sync_status text not null default 'local'
    check (
      sync_status in (
        'local',
        'synced',
        'pending',
        'error'
      )
    ),

  last_synced_at timestamptz,
  sync_error text,

  -- Soft deletion for external sync
  is_deleted boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint smart_calendar_event_valid_time
    check (end_at >= start_at)
);

create index if not exists smart_calendar_events_user_id_idx
  on public.smart_calendar_events(user_id);

create index if not exists smart_calendar_events_calendar_id_idx
  on public.smart_calendar_events(calendar_id);

create index if not exists smart_calendar_events_start_at_idx
  on public.smart_calendar_events(start_at);

create index if not exists smart_calendar_events_user_date_idx
  on public.smart_calendar_events(
    user_id,
    start_at,
    end_at
  );

create index if not exists smart_calendar_events_type_idx
  on public.smart_calendar_events(
    user_id,
    event_type
  );

create unique index if not exists smart_calendar_events_external_unique_idx
  on public.smart_calendar_events(
    user_id,
    external_provider,
    external_event_id
  )
  where external_provider is not null
    and external_event_id is not null;

-- ============================================================
-- EVENT REMINDERS
-- ============================================================

create table if not exists public.smart_calendar_reminders (
  id uuid primary key default gen_random_uuid(),

  event_id uuid not null
    references public.smart_calendar_events(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  minutes_before integer not null default 10
    check (minutes_before >= 0),

  reminder_type text not null default 'notification'
    check (
      reminder_type in (
        'notification',
        'email'
      )
    ),

  is_enabled boolean not null default true,

  created_at timestamptz not null default now()
);

create index if not exists smart_calendar_reminders_event_idx
  on public.smart_calendar_reminders(event_id);

create index if not exists smart_calendar_reminders_user_idx
  on public.smart_calendar_reminders(user_id);

-- ============================================================
-- GOOGLE CALENDAR CONNECTIONS
-- ============================================================

create table if not exists public.google_calendar_connections (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null unique
    references auth.users(id)
    on delete cascade,

  google_account_email text,

  -- Provider identifiers
  google_user_id text,

  is_connected boolean not null default true,

  last_sync_at timestamptz,

  sync_token text,

  connection_error text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists google_calendar_connections_user_idx
  on public.google_calendar_connections(user_id);

-- ============================================================
-- EVENT SYNC LOG
-- ============================================================

create table if not exists public.smart_calendar_sync_log (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  provider text not null
    check (provider in ('google')),

  operation text not null
    check (
      operation in (
        'import',
        'export',
        'update',
        'delete',
        'full_sync'
      )
    ),

  status text not null
    check (
      status in (
        'started',
        'success',
        'error'
      )
    ),

  event_id uuid
    references public.smart_calendar_events(id)
    on delete set null,

  message text,

  created_at timestamptz not null default now()
);

create index if not exists smart_calendar_sync_log_user_idx
  on public.smart_calendar_sync_log(user_id);

create index if not exists smart_calendar_sync_log_created_idx
  on public.smart_calendar_sync_log(created_at desc);

-- ============================================================
-- UPDATED_AT FUNCTION
-- ============================================================

create or replace function public.set_smart_calendar_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

drop trigger if exists set_smart_calendars_updated_at
  on public.smart_calendars;

create trigger set_smart_calendars_updated_at
before update on public.smart_calendars
for each row
execute function public.set_smart_calendar_updated_at();


drop trigger if exists set_smart_calendar_events_updated_at
  on public.smart_calendar_events;

create trigger set_smart_calendar_events_updated_at
before update on public.smart_calendar_events
for each row
execute function public.set_smart_calendar_updated_at();


drop trigger if exists set_google_calendar_connections_updated_at
  on public.google_calendar_connections;

create trigger set_google_calendar_connections_updated_at
before update on public.google_calendar_connections
for each row
execute function public.set_smart_calendar_updated_at();

-- ============================================================
-- RLS
-- ============================================================

alter table public.smart_calendars enable row level security;
alter table public.smart_calendar_events enable row level security;
alter table public.smart_calendar_reminders enable row level security;
alter table public.google_calendar_connections enable row level security;
alter table public.smart_calendar_sync_log enable row level security;

-- ============================================================
-- CALENDAR POLICIES
-- ============================================================

drop policy if exists "Users can view own calendars"
on public.smart_calendars;

create policy "Users can view own calendars"
on public.smart_calendars
for select
using (auth.uid() = user_id);


drop policy if exists "Users can create own calendars"
on public.smart_calendars;

create policy "Users can create own calendars"
on public.smart_calendars
for insert
with check (auth.uid() = user_id);


drop policy if exists "Users can update own calendars"
on public.smart_calendars;

create policy "Users can update own calendars"
on public.smart_calendars
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


drop policy if exists "Users can delete own calendars"
on public.smart_calendars;

create policy "Users can delete own calendars"
on public.smart_calendars
for delete
using (auth.uid() = user_id);

-- ============================================================
-- EVENT POLICIES
-- ============================================================

drop policy if exists "Users can view own calendar events"
on public.smart_calendar_events;

create policy "Users can view own calendar events"
on public.smart_calendar_events
for select
using (auth.uid() = user_id);


drop policy if exists "Users can create own calendar events"
on public.smart_calendar_events;

create policy "Users can create own calendar events"
on public.smart_calendar_events
for insert
with check (auth.uid() = user_id);


drop policy if exists "Users can update own calendar events"
on public.smart_calendar_events;

create policy "Users can update own calendar events"
on public.smart_calendar_events
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


drop policy if exists "Users can delete own calendar events"
on public.smart_calendar_events;

create policy "Users can delete own calendar events"
on public.smart_calendar_events
for delete
using (auth.uid() = user_id);

-- ============================================================
-- REMINDER POLICIES
-- ============================================================

drop policy if exists "Users can view own calendar reminders"
on public.smart_calendar_reminders;

create policy "Users can view own calendar reminders"
on public.smart_calendar_reminders
for select
using (auth.uid() = user_id);


drop policy if exists "Users can create own calendar reminders"
on public.smart_calendar_reminders;

create policy "Users can create own calendar reminders"
on public.smart_calendar_reminders
for insert
with check (auth.uid() = user_id);


drop policy if exists "Users can update own calendar reminders"
on public.smart_calendar_reminders;

create policy "Users can update own calendar reminders"
on public.smart_calendar_reminders
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


drop policy if exists "Users can delete own calendar reminders"
on public.smart_calendar_reminders;

create policy "Users can delete own calendar reminders"
on public.smart_calendar_reminders
for delete
using (auth.uid() = user_id);

-- ============================================================
-- GOOGLE CONNECTION POLICIES
-- ============================================================

drop policy if exists "Users can view own Google connection"
on public.google_calendar_connections;

create policy "Users can view own Google connection"
on public.google_calendar_connections
for select
using (auth.uid() = user_id);


drop policy if exists "Users can create own Google connection"
on public.google_calendar_connections;

create policy "Users can create own Google connection"
on public.google_calendar_connections
for insert
with check (auth.uid() = user_id);


drop policy if exists "Users can update own Google connection"
on public.google_calendar_connections;

create policy "Users can update own Google connection"
on public.google_calendar_connections
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


drop policy if exists "Users can delete own Google connection"
on public.google_calendar_connections;

create policy "Users can delete own Google connection"
on public.google_calendar_connections
for delete
using (auth.uid() = user_id);

-- ============================================================
-- SYNC LOG POLICIES
-- ============================================================

drop policy if exists "Users can view own calendar sync logs"
on public.smart_calendar_sync_log;

create policy "Users can view own calendar sync logs"
on public.smart_calendar_sync_log
for select
using (auth.uid() = user_id);

-- ============================================================
-- DEFAULT CALENDAR HELPER
-- ============================================================

create or replace function public.ensure_default_smart_calendar()
returns public.smart_calendars
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.smart_calendars;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into result
  from public.smart_calendars
  where user_id = auth.uid()
    and is_default = true
  order by created_at
  limit 1;

  if result.id is null then
    insert into public.smart_calendars (
      user_id,
      name,
      description,
      calendar_type,
      is_default
    )
    values (
      auth.uid(),
      'My Calendar',
      'Your JEE Prep Hub study calendar',
      'personal',
      true
    )
    returning *
    into result;
  end if;

  return result;
end;
$$;

grant execute
on function public.ensure_default_smart_calendar()
to authenticated;

-- ============================================================
-- COMMENTS
-- ============================================================

comment on table public.smart_calendars is
'User calendars for JEE Prep Hub Smart Calendar.';

comment on table public.smart_calendar_events is
'Study, exam, lecture, test, deadline and personal calendar events.';

comment on table public.smart_calendar_reminders is
'Per-event reminder configuration.';

comment on table public.google_calendar_connections is
'Google Calendar connection and synchronization metadata.';

comment on table public.smart_calendar_sync_log is
'Audit log for Google Calendar synchronization operations.';