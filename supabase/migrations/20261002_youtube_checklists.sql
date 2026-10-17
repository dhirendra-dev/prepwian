-- ============================================================
-- JEE PREP HUB
-- YouTube Video / Playlist Checklist
-- Migration: 20261002_youtube_checklists.sql
-- ============================================================

create table if not exists public.youtube_checklists (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  description text,

  source_type text not null
    check (source_type in ('video', 'playlist')),

  source_url text not null,

  youtube_playlist_id text,
  current_item_id uuid,

  total_items integer not null default 0,
  completed_items integer not null default 0,

  is_archived boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.youtube_checklist_items (
  id uuid primary key default gen_random_uuid(),

  checklist_id uuid not null
    references public.youtube_checklists(id)
    on delete cascade,

  youtube_video_id text not null,

  title text not null,

  thumbnail_url text,

  duration_seconds integer,

  position integer not null default 0,

  is_completed boolean not null default false,

  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (checklist_id, youtube_video_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists youtube_checklists_user_id_idx
  on public.youtube_checklists(user_id);

create index if not exists youtube_checklists_updated_at_idx
  on public.youtube_checklists(updated_at desc);

create index if not exists youtube_checklist_items_checklist_id_idx
  on public.youtube_checklist_items(checklist_id);

create index if not exists youtube_checklist_items_position_idx
  on public.youtube_checklist_items(checklist_id, position);

create index if not exists youtube_checklist_items_completed_idx
  on public.youtube_checklist_items(checklist_id, is_completed);

-- ============================================================
-- UPDATED_AT FUNCTION
-- ============================================================

create or replace function public.set_youtube_checklist_updated_at()
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

drop trigger if exists youtube_checklists_updated_at
  on public.youtube_checklists;

create trigger youtube_checklists_updated_at
before update on public.youtube_checklists
for each row
execute function public.set_youtube_checklist_updated_at();

drop trigger if exists youtube_checklist_items_updated_at
  on public.youtube_checklist_items;

create trigger youtube_checklist_items_updated_at
before update on public.youtube_checklist_items
for each row
execute function public.set_youtube_checklist_updated_at();

-- ============================================================
-- RECALCULATE CHECKLIST PROGRESS
-- ============================================================

create or replace function public.recalculate_youtube_checklist_progress(
  p_checklist_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.youtube_checklists
  set
    total_items = (
      select count(*)
      from public.youtube_checklist_items
      where checklist_id = p_checklist_id
    ),
    completed_items = (
      select count(*)
      from public.youtube_checklist_items
      where checklist_id = p_checklist_id
        and is_completed = true
    ),
    updated_at = now()
  where id = p_checklist_id;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.youtube_checklists enable row level security;
alter table public.youtube_checklist_items enable row level security;

-- ============================================================
-- CHECKLIST POLICIES
-- ============================================================

drop policy if exists "Users can view own YouTube checklists"
  on public.youtube_checklists;

create policy "Users can view own YouTube checklists"
on public.youtube_checklists
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can create own YouTube checklists"
  on public.youtube_checklists;

create policy "Users can create own YouTube checklists"
on public.youtube_checklists
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own YouTube checklists"
  on public.youtube_checklists;

create policy "Users can update own YouTube checklists"
on public.youtube_checklists
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own YouTube checklists"
  on public.youtube_checklists;

create policy "Users can delete own YouTube checklists"
on public.youtube_checklists
for delete
to authenticated
using (user_id = auth.uid());

-- ============================================================
-- CHECKLIST ITEM POLICIES
-- ============================================================

drop policy if exists "Users can view own checklist items"
  on public.youtube_checklist_items;

create policy "Users can view own checklist items"
on public.youtube_checklist_items
for select
to authenticated
using (
  exists (
    select 1
    from public.youtube_checklists c
    where c.id = youtube_checklist_items.checklist_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "Users can create own checklist items"
  on public.youtube_checklist_items;

create policy "Users can create own checklist items"
on public.youtube_checklist_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.youtube_checklists c
    where c.id = youtube_checklist_items.checklist_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own checklist items"
  on public.youtube_checklist_items;

create policy "Users can update own checklist items"
on public.youtube_checklist_items
for update
to authenticated
using (
  exists (
    select 1
    from public.youtube_checklists c
    where c.id = youtube_checklist_items.checklist_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.youtube_checklists c
    where c.id = youtube_checklist_items.checklist_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own checklist items"
  on public.youtube_checklist_items;

create policy "Users can delete own checklist items"
on public.youtube_checklist_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.youtube_checklists c
    where c.id = youtube_checklist_items.checklist_id
      and c.user_id = auth.uid()
  )
);

-- ============================================================
-- HELPER FUNCTION: TOGGLE COMPLETION
-- ============================================================

create or replace function public.toggle_youtube_checklist_item(
  p_item_id uuid,
  p_completed boolean
)
returns public.youtube_checklist_items
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_item public.youtube_checklist_items;
begin

  update public.youtube_checklist_items
  set
    is_completed = p_completed,
    completed_at = case
      when p_completed then coalesce(completed_at, now())
      else null
    end,
    updated_at = now()
  where id = p_item_id
    and exists (
      select 1
      from public.youtube_checklists c
      where c.id = youtube_checklist_items.checklist_id
        and c.user_id = auth.uid()
    )
  returning * into v_item;

  if v_item.id is null then
    raise exception 'Checklist item not found or access denied';
  end if;

  perform public.recalculate_youtube_checklist_progress(
    v_item.checklist_id
  );

  return v_item;
end;
$$;

-- ============================================================
-- GRANTS
-- ============================================================

grant execute on function public.recalculate_youtube_checklist_progress(uuid)
to authenticated;

grant execute on function public.toggle_youtube_checklist_item(uuid, boolean)
to authenticated;

-- ============================================================
-- COMMENTS
-- ============================================================

comment on table public.youtube_checklists is
'User-owned YouTube videos/playlists converted into study checklists.';

comment on table public.youtube_checklist_items is
'Individual YouTube videos belonging to a user checklist.';

comment on column public.youtube_checklists.current_item_id is
'Currently selected video item for the floating player.';

comment on column public.youtube_checklist_items.position is
'Original or user-defined order of the video inside the checklist.';

comment on column public.youtube_checklist_items.is_completed is
'Whether the user has completed this video.';