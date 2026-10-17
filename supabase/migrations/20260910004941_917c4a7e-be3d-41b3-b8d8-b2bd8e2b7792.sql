-- 1. Membership helper (security definer, avoids policy recursion)
create or replace function public.is_group_member(_group uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_members where group_id = _group and user_id = _user)
$$;
revoke all on function public.is_group_member(uuid, uuid) from public, anon;
grant execute on function public.is_group_member(uuid, uuid) to authenticated;

-- 2. Groups: private group rows (incl. invite_code) only for members/owner/admin
drop policy if exists "Anyone signed in can view groups" on public.groups;
create policy "Open groups and own groups are visible" on public.groups
for select to authenticated using (
  coalesce(privacy, 'open') = 'open'
  or owner_id = auth.uid()
  or public.is_group_member(id, auth.uid())
  or public.has_role(auth.uid(), 'admin')
);

-- Join-by-invite lookup without exposing invite codes
create or replace function public.group_by_invite_code(_code text)
returns table (id uuid, name text, description text, privacy text)
language sql stable security definer set search_path = public as $$
  select g.id, g.name, g.description, g.privacy::text
  from public.groups g
  where g.invite_code = _code or g.invite_slug = _code
  limit 1
$$;
revoke all on function public.group_by_invite_code(text) from public, anon;
grant execute on function public.group_by_invite_code(text) to authenticated;

-- 3. Study materials: locked behind a password gate served by the server
drop policy if exists "Authenticated users can view materials" on public.materials;
create policy "Admins can view materials" on public.materials
for select to authenticated using (public.has_role(auth.uid(), 'admin'));
revoke select on public.materials from anon;

create table if not exists public.material_gate (
  id boolean primary key default true check (id),
  password_hash text not null,
  updated_at timestamptz not null default now()
);
grant all on public.material_gate to service_role;
alter table public.material_gate enable row level security;

insert into public.material_gate (id, password_hash)
values (true, '85d5c98d3f07776452fb82eed661b665256e2ddc8dba09432e5ef338f462ca30')
on conflict (id) do nothing;