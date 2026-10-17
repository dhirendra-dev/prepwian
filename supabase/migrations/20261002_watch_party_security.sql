-- ============================================================
-- JEE PREP HUB — WATCH PARTY SECURITY & REALTIME
-- Migration: 20261002_watch_party_security.sql
--
-- This migration assumes the Watch Party core tables already
-- exist:
--   watch_rooms
--   watch_room_members
--   watch_room_queue
--   watch_room_completions
--   watch_room_events
--   watch_room_messages
--
-- Based on the Watch Party implementation specification.
-- ============================================================


-- ============================================================
-- 1. ENABLE ROW LEVEL SECURITY
-- ============================================================

alter table public.watch_rooms enable row level security;
alter table public.watch_room_members enable row level security;
alter table public.watch_room_queue enable row level security;
alter table public.watch_room_completions enable row level security;
alter table public.watch_room_events enable row level security;
alter table public.watch_room_messages enable row level security;


-- ============================================================
-- 2. HELPER FUNCTIONS
-- ============================================================

create or replace function public.is_watch_room_member(
  _room_id uuid,
  _user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.watch_room_members
    where room_id = _room_id
      and user_id = _user_id
      and status = 'active'
  );
$$;


create or replace function public.watch_room_member_role(
  _room_id uuid,
  _user_id uuid default auth.uid()
)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.watch_room_members
  where room_id = _room_id
    and user_id = _user_id
    and status = 'active'
  limit 1;
$$;


create or replace function public.can_moderate_watch_room(
  _room_id uuid,
  _user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.watch_room_member_role(
    _room_id,
    _user_id
  ) in ('host', 'moderator');
$$;


-- ============================================================
-- 3. WATCH ROOMS — RLS
-- ============================================================

drop policy if exists watch_rooms_select
on public.watch_rooms;

create policy watch_rooms_select
on public.watch_rooms
for select
using (
  visibility in ('public', 'unlisted')
  or public.is_watch_room_member(id)
);


drop policy if exists watch_rooms_insert
on public.watch_rooms;

create policy watch_rooms_insert
on public.watch_rooms
for insert
to authenticated
with check (
  host_id = auth.uid()
);


drop policy if exists watch_rooms_update
on public.watch_rooms;

create policy watch_rooms_update
on public.watch_rooms
for update
to authenticated
using (
  host_id = auth.uid()
)
with check (
  host_id = auth.uid()
);


drop policy if exists watch_rooms_delete
on public.watch_rooms;

create policy watch_rooms_delete
on public.watch_rooms
for delete
to authenticated
using (
  host_id = auth.uid()
);


-- ============================================================
-- 4. ROOM MEMBERS
-- ============================================================

drop policy if exists watch_room_members_select
on public.watch_room_members;

create policy watch_room_members_select
on public.watch_room_members
for select
to authenticated
using (
  public.is_watch_room_member(room_id)
  or public.can_moderate_watch_room(room_id)
);


drop policy if exists watch_room_members_insert
on public.watch_room_members;

create policy watch_room_members_insert
on public.watch_room_members
for insert
to authenticated
with check (
  (
    user_id = auth.uid()
    and exists (
      select 1
      from public.watch_rooms r
      where r.id = room_id
        and r.visibility in ('public', 'unlisted')
    )
    and role = 'participant'
  )
  or public.can_moderate_watch_room(room_id)
);


drop policy if exists watch_room_members_update
on public.watch_room_members;

create policy watch_room_members_update
on public.watch_room_members
for update
to authenticated
using (
  public.can_moderate_watch_room(room_id)
  or user_id = auth.uid()
)
with check (
  public.can_moderate_watch_room(room_id)
  or (
    user_id = auth.uid()
    and role = 'participant'
  )
);


drop policy if exists watch_room_members_delete
on public.watch_room_members;

create policy watch_room_members_delete
on public.watch_room_members
for delete
to authenticated
using (
  public.can_moderate_watch_room(room_id)
  or user_id = auth.uid()
);


-- ============================================================
-- 5. QUEUE
-- ============================================================

drop policy if exists watch_room_queue_select
on public.watch_room_queue;

create policy watch_room_queue_select
on public.watch_room_queue
for select
using (
  public.is_watch_room_member(room_id)
  or exists (
    select 1
    from public.watch_rooms r
    where r.id = room_id
      and r.visibility in ('public', 'unlisted')
  )
);


drop policy if exists watch_room_queue_insert
on public.watch_room_queue;

create policy watch_room_queue_insert
on public.watch_room_queue
for insert
to authenticated
with check (
  public.can_moderate_watch_room(room_id)
  or (
    public.is_watch_room_member(room_id)
    and exists (
      select 1
      from public.watch_rooms r
      where r.id = room_id
        and r.allow_participant_control = true
    )
  )
);


drop policy if exists watch_room_queue_update
on public.watch_room_queue;

create policy watch_room_queue_update
on public.watch_room_queue
for update
to authenticated
using (
  public.can_moderate_watch_room(room_id)
  or (
    public.is_watch_room_member(room_id)
    and exists (
      select 1
      from public.watch_rooms r
      where r.id = room_id
        and r.allow_participant_control = true
    )
  )
)
with check (
  public.can_moderate_watch_room(room_id)
  or (
    public.is_watch_room_member(room_id)
    and exists (
      select 1
      from public.watch_rooms r
      where r.id = room_id
        and r.allow_participant_control = true
    )
  )
);


drop policy if exists watch_room_queue_delete
on public.watch_room_queue;

create policy watch_room_queue_delete
on public.watch_room_queue
for delete
to authenticated
using (
  public.can_moderate_watch_room(room_id)
  or (
    public.is_watch_room_member(room_id)
    and exists (
      select 1
      from public.watch_rooms r
      where r.id = room_id
        and r.allow_participant_control = true
    )
  )
);


-- ============================================================
-- 6. COMPLETION TRACKING
-- ============================================================

drop policy if exists watch_room_completions_select
on public.watch_room_completions;

create policy watch_room_completions_select
on public.watch_room_completions
for select
to authenticated
using (
  user_id = auth.uid()
  or public.can_moderate_watch_room(room_id)
);


drop policy if exists watch_room_completions_insert
on public.watch_room_completions;

create policy watch_room_completions_insert
on public.watch_room_completions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_watch_room_member(room_id)
);


drop policy if exists watch_room_completions_delete
on public.watch_room_completions;

create policy watch_room_completions_delete
on public.watch_room_completions
for delete
to authenticated
using (
  user_id = auth.uid()
  or public.can_moderate_watch_room(room_id)
);


-- ============================================================
-- 7. ROOM EVENTS / AUDIT LOG
-- ============================================================

drop policy if exists watch_room_events_select
on public.watch_room_events;

create policy watch_room_events_select
on public.watch_room_events
for select
to authenticated
using (
  public.is_watch_room_member(room_id)
);


drop policy if exists watch_room_events_insert
on public.watch_room_events;

create policy watch_room_events_insert
on public.watch_room_events
for insert
to authenticated
with check (
  actor_id = auth.uid()
  and public.can_moderate_watch_room(room_id)
);


-- ============================================================
-- 8. ROOM CHAT
-- ============================================================

drop policy if exists watch_room_messages_select
on public.watch_room_messages;

create policy watch_room_messages_select
on public.watch_room_messages
for select
to authenticated
using (
  public.is_watch_room_member(room_id)
);


drop policy if exists watch_room_messages_insert
on public.watch_room_messages;

create policy watch_room_messages_insert
on public.watch_room_messages
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_watch_room_member(room_id)
);


drop policy if exists watch_room_messages_update
on public.watch_room_messages;

create policy watch_room_messages_update
on public.watch_room_messages
for update
to authenticated
using (
  public.can_moderate_watch_room(room_id)
)
with check (
  public.can_moderate_watch_room(room_id)
);


drop policy if exists watch_room_messages_delete
on public.watch_room_messages;

create policy watch_room_messages_delete
on public.watch_room_messages
for delete
to authenticated
using (
  public.can_moderate_watch_room(room_id)
);


-- ============================================================
-- 9. AUTHORITATIVE PLAYBACK RPC
-- ============================================================

create or replace function public.persist_watch_room_playback(
  _room_id uuid,
  _video_id text,
  _queue_item_id uuid,
  _is_playing boolean,
  _position_seconds numeric,
  _playback_rate numeric,
  _sequence bigint,
  _updated_at timestamptz
)
returns public.watch_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.watch_rooms;
begin

  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;


  if not exists (
    select 1
    from public.watch_rooms
    where id = _room_id
      and host_id = auth.uid()
  ) then
    raise exception 'Only the room host may update authoritative playback';
  end if;


  if _position_seconds < 0 then
    raise exception 'Invalid playback position';
  end if;


  if _playback_rate <= 0
     or _playback_rate > 2 then
    raise exception 'Invalid playback rate';
  end if;


  if _sequence < 0 then
    raise exception 'Invalid playback sequence';
  end if;


  update public.watch_rooms
  set
    current_video_id = _video_id,
    current_queue_item_id = _queue_item_id,
    is_playing = _is_playing,
    position_seconds = _position_seconds,
    playback_rate = _playback_rate,
    playback_sequence = _sequence,
    playback_updated_at = coalesce(
      _updated_at,
      now()
    ),
    playback_updated_by = auth.uid(),
    updated_at = now()
  where id = _room_id
    and host_id = auth.uid()
    and _sequence >= playback_sequence
  returning *
  into result;


  if result.id is null then
    select *
    into result
    from public.watch_rooms
    where id = _room_id;
  end if;


  return result;

end;
$$;


grant execute
on function public.persist_watch_room_playback(
  uuid,
  text,
  uuid,
  boolean,
  numeric,
  numeric,
  bigint,
  timestamptz
)
to authenticated;


-- ============================================================
-- 10. END ROOM
-- ============================================================

create or replace function public.end_watch_room(
  _room_id uuid
)
returns public.watch_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.watch_rooms;
begin

  update public.watch_rooms
  set
    status = 'ended',
    is_playing = false,
    updated_at = now()
  where id = _room_id
    and host_id = auth.uid()
  returning *
  into result;


  if result.id is null then
    raise exception 'Only the host may end this room';
  end if;


  return result;

end;
$$;


grant execute
on function public.end_watch_room(uuid)
to authenticated;


-- ============================================================
-- 11. HOST TRANSFER
-- ============================================================

create or replace function public.transfer_watch_room_host(
  _room_id uuid,
  _new_host_id uuid
)
returns public.watch_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.watch_rooms;
begin

  if not public.can_moderate_watch_room(_room_id) then
    raise exception 'Only the host or moderator may transfer the host';
  end if;


  if not public.is_watch_room_member(
    _room_id,
    _new_host_id
  ) then
    raise exception 'New host must be an active room member';
  end if;


  update public.watch_rooms
  set
    host_id = _new_host_id,
    updated_at = now()
  where id = _room_id
  returning *
  into result;


  update public.watch_room_members
  set
    role = case
      when user_id = _new_host_id then 'host'
      when role = 'host' then 'moderator'
      else role
    end,
    updated_at = now()
  where room_id = _room_id;


  return result;

end;
$$;


grant execute
on function public.transfer_watch_room_host(
  uuid,
  uuid
)
to authenticated;


-- ============================================================
-- 12. REALTIME
-- ============================================================

alter table public.watch_rooms
replica identity full;

alter table public.watch_room_members
replica identity full;

alter table public.watch_room_queue
replica identity full;

alter table public.watch_room_messages
replica identity full;

alter table public.watch_room_events
replica identity full;


do $$
begin

  begin
    alter publication supabase_realtime
      add table public.watch_rooms;
  exception
    when duplicate_object then null;
  end;


  begin
    alter publication supabase_realtime
      add table public.watch_room_members;
  exception
    when duplicate_object then null;
  end;


  begin
    alter publication supabase_realtime
      add table public.watch_room_queue;
  exception
    when duplicate_object then null;
  end;


  begin
    alter publication supabase_realtime
      add table public.watch_room_messages;
  exception
    when duplicate_object then null;
  end;


  begin
    alter publication supabase_realtime
      add table public.watch_room_events;
  exception
    when duplicate_object then null;
  end;

end
$$;


-- ============================================================
-- 13. PERFORMANCE INDEXES
-- ============================================================

create index if not exists watch_rooms_status_visibility_idx
on public.watch_rooms(
  status,
  visibility,
  created_at desc
);


create index if not exists watch_rooms_host_idx
on public.watch_rooms(host_id);


create index if not exists watch_room_members_user_idx
on public.watch_room_members(
  user_id,
  status
);


create index if not exists watch_room_members_room_role_idx
on public.watch_room_members(
  room_id,
  role,
  status
);


create index if not exists watch_room_queue_room_position_idx
on public.watch_room_queue(
  room_id,
  position
);


create index if not exists watch_room_messages_room_created_idx
on public.watch_room_messages(
  room_id,
  created_at
);


create index if not exists watch_room_events_room_created_idx
on public.watch_room_events(
  room_id,
  created_at desc
);


create index if not exists watch_room_completions_user_idx
on public.watch_room_completions(
  user_id,
  completed_at desc
);


-- ============================================================
-- END OF MIGRATION
-- ============================================================