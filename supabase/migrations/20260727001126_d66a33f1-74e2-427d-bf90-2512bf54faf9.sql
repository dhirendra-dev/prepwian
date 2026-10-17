-- Enums
do $$ begin create type test_attempt_status as enum ('in_progress','submitted','auto_submitted','abandoned'); exception when duplicate_object then null; end $$;
do $$ begin create type test_difficulty as enum ('easy','moderate','hard'); exception when duplicate_object then null; end $$;
do $$ begin create type test_exam_type as enum ('jee_main','jee_advanced','neet','chapter_test','unit_test','full_syllabus','mock_test','pyq'); exception when duplicate_object then null; end $$;
do $$ begin create type test_mode as enum ('practice','live','challenge','daily','weekly','monthly'); exception when duplicate_object then null; end $$;
do $$ begin create type test_question_type as enum ('single','multiple','integer','numerical'); exception when duplicate_object then null; end $$;
do $$ begin create type test_status as enum ('draft','published','scheduled','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type test_subject_kind as enum ('physics','chemistry','mathematics','biology','mixed'); exception when duplicate_object then null; end $$;
do $$ begin create type test_visibility as enum ('public','private'); exception when duplicate_object then null; end $$;

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(), name text not null, description text,
  exam_type test_exam_type not null default 'jee_main', subject test_subject_kind not null default 'mixed',
  chapters text[] not null default '{}', difficulty test_difficulty not null default 'moderate',
  duration_min integer not null default 60, total_marks numeric not null default 0,
  default_marks_per_question numeric not null default 4, default_negative_per_question numeric not null default 1,
  instructions text, language text not null default 'english', max_attempts integer not null default 3,
  is_premium boolean not null default false, visibility test_visibility not null default 'public',
  status test_status not null default 'draft', mode test_mode not null default 'practice',
  starts_at timestamptz, ends_at timestamptz, shuffle_questions boolean not null default false, shuffle_options boolean not null default false,
  created_by uuid not null, approval_status text not null default 'approved', review_notes text, reviewed_by uuid, reviewed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.test_questions (
  id uuid primary key default gen_random_uuid(), test_id uuid not null references public.tests(id) on delete cascade,
  order_no integer not null default 0, question_type test_question_type not null default 'single', question_text text not null,
  image_url text, subject test_subject_kind, chapter text, marks numeric not null default 4, negative_marks numeric not null default 1,
  explanation text, correct_numerical numeric, numerical_tolerance numeric not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.test_options (
  id uuid primary key default gen_random_uuid(), question_id uuid not null references public.test_questions(id) on delete cascade,
  label text not null, text text not null, is_correct boolean not null default false, order_no integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(), test_id uuid not null references public.tests(id) on delete cascade, user_id uuid not null,
  started_at timestamptz not null default now(), submitted_at timestamptz, duration_sec integer,
  status test_attempt_status not null default 'in_progress', question_order text[], option_order jsonb,
  score numeric not null default 0, max_score numeric not null default 0, correct_count integer not null default 0,
  wrong_count integer not null default 0, skipped_count integer not null default 0, accuracy numeric not null default 0,
  negative_total numeric not null default 0, percentile numeric, tab_switch_count integer not null default 0,
  fullscreen_exit_count integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.test_responses (
  id uuid primary key default gen_random_uuid(), attempt_id uuid not null references public.test_attempts(id) on delete cascade,
  question_id uuid not null references public.test_questions(id) on delete cascade, selected_option_ids uuid[] not null default '{}',
  numerical_answer numeric, marked_for_review boolean not null default false, visited boolean not null default true,
  time_spent_sec integer not null default 0, is_correct boolean, marks_awarded numeric not null default 0,
  updated_at timestamptz not null default now(), unique(attempt_id, question_id)
);
create table if not exists public.test_bookmarks (
  test_id uuid not null references public.tests(id) on delete cascade, user_id uuid not null,
  created_at timestamptz not null default now(), primary key (test_id, user_id)
);
create table if not exists public.test_reports (
  id uuid primary key default gen_random_uuid(), question_id uuid not null references public.test_questions(id) on delete cascade,
  user_id uuid not null, reason text not null, status text not null default 'open', created_at timestamptz not null default now()
);
create table if not exists public.test_pdf_uploads (
  id uuid primary key default gen_random_uuid(), test_id uuid references public.tests(id) on delete set null, uploaded_by uuid not null,
  file_path text not null, file_name text not null, kind text not null default 'questions', status text not null default 'uploaded',
  parsed_json jsonb, question_count integer not null default 0, error text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

grant select on public.tests to anon;
grant select, insert, update, delete on public.tests to authenticated;
grant all on public.tests to service_role;
grant select on public.test_questions to anon;
grant select, insert, update, delete on public.test_questions to authenticated;
grant all on public.test_questions to service_role;
grant select on public.test_options to anon;
grant select, insert, update, delete on public.test_options to authenticated;
grant all on public.test_options to service_role;
grant select, insert, update, delete on public.test_attempts to authenticated;
grant all on public.test_attempts to service_role;
grant select, insert, update, delete on public.test_responses to authenticated;
grant all on public.test_responses to service_role;
grant select, insert, update, delete on public.test_bookmarks to authenticated;
grant all on public.test_bookmarks to service_role;
grant select, insert, update, delete on public.test_reports to authenticated;
grant all on public.test_reports to service_role;
grant select, insert, update, delete on public.test_pdf_uploads to authenticated;
grant all on public.test_pdf_uploads to service_role;

alter table public.tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_options enable row level security;
alter table public.test_attempts enable row level security;
alter table public.test_responses enable row level security;
alter table public.test_bookmarks enable row level security;
alter table public.test_reports enable row level security;
alter table public.test_pdf_uploads enable row level security;

create policy "tests_public_read" on public.tests for select using (status = 'published' and visibility = 'public');
create policy "tests_owner_read" on public.tests for select using (auth.uid() = created_by);
create policy "tests_admin_all" on public.tests for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));
create policy "tests_owner_insert" on public.tests for insert with check (auth.uid() = created_by);
create policy "tests_owner_update_draft" on public.tests for update using (auth.uid() = created_by and status = 'draft');

create policy "test_questions_read" on public.test_questions for select using (
  exists (select 1 from public.tests t where t.id = test_id and (
    (t.status = 'published' and t.visibility = 'public') or t.created_by = auth.uid() or has_role(auth.uid(),'admin')
  ))
);
create policy "test_questions_owner_write" on public.test_questions for all using (
  exists (select 1 from public.tests t where t.id = test_id and t.created_by = auth.uid() and t.status = 'draft')
) with check (
  exists (select 1 from public.tests t where t.id = test_id and t.created_by = auth.uid() and t.status = 'draft')
);
create policy "test_questions_admin_all" on public.test_questions for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

create policy "test_options_read" on public.test_options for select using (
  exists (select 1 from public.test_questions q join public.tests t on t.id = q.test_id where q.id = question_id and (
    (t.status = 'published' and t.visibility = 'public') or t.created_by = auth.uid() or has_role(auth.uid(),'admin')
  ))
);
create policy "test_options_owner_write" on public.test_options for all using (
  exists (select 1 from public.test_questions q join public.tests t on t.id = q.test_id where q.id = question_id and t.created_by = auth.uid() and t.status = 'draft')
) with check (
  exists (select 1 from public.test_questions q join public.tests t on t.id = q.test_id where q.id = question_id and t.created_by = auth.uid() and t.status = 'draft')
);
create policy "test_options_admin_all" on public.test_options for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

create policy "attempts_owner_all" on public.test_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "attempts_admin_read" on public.test_attempts for select using (has_role(auth.uid(),'admin'));
create policy "responses_owner_all" on public.test_responses for all using (exists (select 1 from public.test_attempts a where a.id = attempt_id and a.user_id = auth.uid())) with check (exists (select 1 from public.test_attempts a where a.id = attempt_id and a.user_id = auth.uid()));
create policy "bookmarks_owner_all" on public.test_bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reports_owner_insert" on public.test_reports for insert with check (auth.uid() = user_id);
create policy "reports_admin_read" on public.test_reports for select using (has_role(auth.uid(),'admin'));
create policy "pdf_owner_all" on public.test_pdf_uploads for all using (auth.uid() = uploaded_by) with check (auth.uid() = uploaded_by);
create policy "pdf_admin_all" on public.test_pdf_uploads for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

create or replace function public.compute_test_percentile(_attempt_id uuid) returns numeric language plpgsql security definer set search_path = public as $$
declare _test_id uuid; _my_score numeric; _total int; _below int; _pct numeric;
begin
  select test_id, score into _test_id, _my_score from public.test_attempts where id = _attempt_id;
  select count(*) into _total from public.test_attempts where test_id = _test_id and status in ('submitted','auto_submitted');
  select count(*) into _below from public.test_attempts where test_id = _test_id and status in ('submitted','auto_submitted') and score < _my_score;
  if _total <= 1 then return 100; end if;
  _pct := round((_below::numeric / (_total - 1)) * 100, 2);
  return _pct;
end; $$;
revoke execute on function public.compute_test_percentile(uuid) from public;
grant execute on function public.compute_test_percentile(uuid) to authenticated;

-- Storage policies for the test-pdfs bucket
create policy "test_pdfs_owner_rw" on storage.objects for all using (bucket_id = 'test-pdfs' and auth.uid()::text = (storage.foldername(name))[1]) with check (bucket_id = 'test-pdfs' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "test_pdfs_admin_all" on storage.objects for all using (bucket_id = 'test-pdfs' and has_role(auth.uid(),'admin')) with check (bucket_id = 'test-pdfs' and has_role(auth.uid(),'admin'));

-- Security fix: prevent squad members promoting themselves to admin/owner
drop policy if exists "Squad admins can update member roles" on public.study_group_members;
create policy "Squad admins can update member roles"
  on public.study_group_members
  for update
  using (public.is_squad_admin(group_id, auth.uid()))
  with check (public.is_squad_admin(group_id, auth.uid()));
