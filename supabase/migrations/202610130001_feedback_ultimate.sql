-- Feedback Ultimate schema and migration from the legacy feedback hub.
-- Existing installations already have feedback_submissions with legacy columns;
-- this migration preserves those rows while adding the new report workflow.
create extension if not exists pgcrypto;

create table if not exists public.feedback_submissions (
 id uuid primary key default gen_random_uuid(),
 public_id text unique default ('FB-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('suggestion','bug','question')),
 title text not null check(char_length(btrim(title)) between 5 and 120),
 description text not null check(char_length(btrim(description)) between 15 and 3000),
 page_url text check(page_url is null or char_length(page_url)<=500),
 status text not null default 'submitted' check(status in ('submitted','under_review','planned','in_progress','waiting_for_user','completed','declined')),
 priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),
 admin_response text check(admin_response is null or char_length(admin_response)<=3000),
 steps_to_reproduce text check(steps_to_reproduce is null or char_length(steps_to_reproduce)<=3000),
 expected_behavior text check(expected_behavior is null or char_length(expected_behavior)<=1500),
 actual_behavior text check(actual_behavior is null or char_length(actual_behavior)<=1500),
 severity text not null default 'normal' check(severity in ('low','normal','high','urgent')),
 technical_details jsonb,
 attachments jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 resolved_at timestamptz
);

-- Add the new columns to legacy installations.
alter table public.feedback_submissions add column if not exists public_id text;
alter table public.feedback_submissions add column if not exists title text;
alter table public.feedback_submissions add column if not exists description text;
alter table public.feedback_submissions add column if not exists page_url text;
alter table public.feedback_submissions add column if not exists priority text not null default 'normal';
alter table public.feedback_submissions add column if not exists admin_response text;
alter table public.feedback_submissions add column if not exists resolved_at timestamptz;
alter table public.feedback_submissions add column if not exists steps_to_reproduce text;
alter table public.feedback_submissions add column if not exists expected_behavior text;
alter table public.feedback_submissions add column if not exists actual_behavior text;
alter table public.feedback_submissions add column if not exists severity text not null default 'normal';
alter table public.feedback_submissions add column if not exists technical_details jsonb;
alter table public.feedback_submissions add column if not exists attachments jsonb;

-- Normalize legacy values before replacing the legacy check constraints.
alter table public.feedback_submissions drop constraint if exists feedback_submissions_kind_check;
alter table public.feedback_submissions drop constraint if exists feedback_submissions_status_check;
update public.feedback_submissions set kind = case kind when 'feedback' then 'suggestion' when 'material_request' then 'question' else kind end;
update public.feedback_submissions set status = case status when 'pending' then 'submitted' when 'rejected' then 'declined' else status end;
update public.feedback_submissions set title = left(coalesce(nullif(btrim(title), ''), nullif(btrim(subject), ''), 'Legacy feedback'), 120) where title is null or btrim(title) = '';
update public.feedback_submissions set description = left(coalesce(nullif(btrim(description), ''), nullif(btrim(message), ''), 'Legacy feedback submission'), 3000) where description is null or btrim(description) = '';
alter table public.feedback_submissions alter column title set not null;
alter table public.feedback_submissions alter column description set not null;
alter table public.feedback_submissions alter column category drop not null;
alter table public.feedback_submissions alter column subject drop not null;
alter table public.feedback_submissions alter column message drop not null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'feedback_submissions_kind_ultimate_check') then
    alter table public.feedback_submissions add constraint feedback_submissions_kind_ultimate_check check(kind in ('suggestion','bug','question'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'feedback_submissions_status_ultimate_check') then
    alter table public.feedback_submissions add constraint feedback_submissions_status_ultimate_check check(status in ('submitted','under_review','planned','in_progress','waiting_for_user','completed','declined'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'feedback_submissions_priority_ultimate_check') then
    alter table public.feedback_submissions add constraint feedback_submissions_priority_ultimate_check check(priority in ('low','normal','high','urgent'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'feedback_submissions_severity_ultimate_check') then
    alter table public.feedback_submissions add constraint feedback_submissions_severity_ultimate_check check(severity in ('low','normal','high','urgent'));
  end if;
end $$;

create unique index if not exists feedback_submissions_public_id_idx on public.feedback_submissions(public_id) where public_id is not null;
create index if not exists feedback_submissions_user_created_idx on public.feedback_submissions(user_id,created_at desc);
create index if not exists feedback_submissions_status_created_idx on public.feedback_submissions(status,created_at desc);
create index if not exists feedback_submissions_kind_created_idx on public.feedback_submissions(kind,created_at desc);
alter table public.feedback_submissions enable row level security;

create or replace function public.is_feedback_admin()
returns boolean language sql stable security definer set search_path=''
as $$
 select exists(select 1 from public.user_roles ur where ur.user_id=(select auth.uid()) and ur.role::text='admin');
$$;
revoke all on function public.is_feedback_admin() from public;
grant execute on function public.is_feedback_admin() to authenticated;

-- Replace both legacy and upgrade policies so legacy permissive policies cannot widen access.
drop policy if exists fs_select on public.feedback_submissions;
drop policy if exists fs_insert on public.feedback_submissions;
drop policy if exists fs_admin_update on public.feedback_submissions;
drop policy if exists fs_admin_delete on public.feedback_submissions;
drop policy if exists feedback_select_own_or_admin on public.feedback_submissions;
drop policy if exists feedback_insert_own on public.feedback_submissions;
drop policy if exists feedback_update_admin on public.feedback_submissions;
create policy feedback_select_own_or_admin on public.feedback_submissions for select to authenticated using(user_id=(select auth.uid()) or (select public.is_feedback_admin()));
create policy feedback_insert_own on public.feedback_submissions for insert to authenticated with check(user_id=(select auth.uid()) and status='submitted' and priority='normal' and admin_response is null and resolved_at is null);
create policy feedback_update_admin on public.feedback_submissions for update to authenticated using((select public.is_feedback_admin())) with check((select public.is_feedback_admin()));
revoke all on public.feedback_submissions from anon,public;
grant select,insert,update on public.feedback_submissions to authenticated;

create or replace function public.set_feedback_updated_at()
returns trigger language plpgsql set search_path=''
as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists feedback_submissions_updated_at on public.feedback_submissions;
create trigger feedback_submissions_updated_at before update on public.feedback_submissions for each row execute function public.set_feedback_updated_at();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('feedback-attachments','feedback-attachments',false,5242880,array['image/png','image/jpeg','image/webp'])
on conflict(id) do nothing;
drop policy if exists feedback_attachments_insert_own on storage.objects;
drop policy if exists feedback_attachments_select_own_or_admin on storage.objects;
drop policy if exists feedback_attachments_delete_own on storage.objects;
create policy feedback_attachments_insert_own on storage.objects for insert to authenticated with check(bucket_id='feedback-attachments' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy feedback_attachments_select_own_or_admin on storage.objects for select to authenticated using(bucket_id='feedback-attachments' and ((storage.foldername(name))[1]=(select auth.uid())::text or (select public.is_feedback_admin())));
create policy feedback_attachments_delete_own on storage.objects for delete to authenticated using(bucket_id='feedback-attachments' and ((storage.foldername(name))[1]=(select auth.uid())::text or (select public.is_feedback_admin())));
