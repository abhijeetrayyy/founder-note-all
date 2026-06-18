-- ============================================================================
-- Founder — Full Supabase schema
-- ============================================================================
-- Run this in the Supabase SQL editor (or via `supabase db push`) to set up
-- every table, row-level security policy, index, and trigger the app needs.
--
-- Tables created:
--   users_profile, projects, notes, note_tags, tags, tasks, task_tags,
--   reminders, journal_entries, habits, habit_logs, daily_plans, goals,
--   energy_logs
--
-- Storage:
--   "avatars" bucket (for profile pictures, optional)
--
-- Realtime:
--   All data tables are added to the supabase_realtime publication
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Enable required extensions
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";  -- for fast ILIKE search

-- ---------------------------------------------------------------------------
-- 1. USERS_PROFILE
--    Extra fields that live alongside auth.users (which is created by Supabase
--    Auth on signup). One row per user, identified by the same UUID.
-- ---------------------------------------------------------------------------
create table if not exists public.users_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  energy_default int not null default 1 check (energy_default between 0 and 2),
  onboarding_completed boolean not null default false,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users_profile enable row level security;

drop policy if exists "users_profile_select_own" on public.users_profile;
create policy "users_profile_select_own"
  on public.users_profile for select
  using (auth.uid() = id);

drop policy if exists "users_profile_insert_own" on public.users_profile;
create policy "users_profile_insert_own"
  on public.users_profile for insert
  with check (auth.uid() = id);

drop policy if exists "users_profile_update_own" on public.users_profile;
create policy "users_profile_update_own"
  on public.users_profile for update
  using (auth.uid() = id);

drop policy if exists "users_profile_delete_own" on public.users_profile;
create policy "users_profile_delete_own"
  on public.users_profile for delete
  using (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users_profile (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. PROJECTS
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  color bigint not null default 4288585374,   -- 0xFF5B4FE9
  icon_index int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_projects_user on public.projects(user_id);

alter table public.projects enable row level security;
drop policy if exists "projects_all_own" on public.projects;
create policy "projects_all_own"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. TAGS
-- ---------------------------------------------------------------------------
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color bigint not null default 4288585374,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
create index if not exists idx_tags_user on public.tags(user_id);

alter table public.tags enable row level security;
drop policy if exists "tags_all_own" on public.tags;
create policy "tags_all_own"
  on public.tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. NOTES
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  category text not null default 'General',
  color bigint not null default 4288585374,
  project_id uuid references public.projects(id) on delete set null,
  is_pinned boolean not null default false,
  is_archived boolean not null default false,
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_notes_user on public.notes(user_id);
create index if not exists idx_notes_user_updated on public.notes(user_id, updated_at desc);
create index if not exists idx_notes_user_archived on public.notes(user_id, is_archived);
create index if not exists idx_notes_user_pinned on public.notes(user_id, is_pinned desc);
create index if not exists idx_notes_user_project on public.notes(user_id, project_id);
create index if not exists idx_notes_user_category on public.notes(user_id, category);
create index if not exists idx_notes_title_trgm on public.notes using gin (title gin_trgm_ops);
create index if not exists idx_notes_content_trgm on public.notes using gin (content gin_trgm_ops);

alter table public.notes enable row level security;
drop policy if exists "notes_all_own" on public.notes;
create policy "notes_all_own"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Full-text search via generated column
alter table public.notes
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) stored;
create index if not exists idx_notes_search on public.notes using gin (search_vector);

-- ---------------------------------------------------------------------------
-- 5. NOTE ↔ TAGS (junction)
-- ---------------------------------------------------------------------------
create table if not exists public.note_tags (
  note_id uuid not null references public.notes(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (note_id, tag_id)
);

alter table public.note_tags enable row level security;
drop policy if exists "note_tags_all" on public.note_tags;
create policy "note_tags_all"
  on public.note_tags for all
  using (
    exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 6. TASKS
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  priority int not null default 1 check (priority between 0 and 2),
  completed boolean not null default false,
  completed_at timestamptz,
  due_date timestamptz,
  project_id uuid references public.projects(id) on delete set null,
  parent_id uuid references public.tasks(id) on delete cascade,
  recurrence int not null default 0 check (recurrence between 0 and 3),
  -- Execution intelligence fields
  energy_level int not null default 1 check (energy_level between 0 and 2),
  estimated_minutes int,
  actual_minutes int,
  first_step text not null default '',
  implementation_intention text not null default '',
  is_inbox boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tasks_user on public.tasks(user_id);
create index if not exists idx_tasks_user_completed on public.tasks(user_id, completed);
create index if not exists idx_tasks_user_due on public.tasks(user_id, due_date);
create index if not exists idx_tasks_user_project on public.tasks(user_id, project_id);
create index if not exists idx_tasks_user_parent on public.tasks(user_id, parent_id);
create index if not exists idx_tasks_user_inbox on public.tasks(user_id, is_inbox) where is_inbox = true;
create index if not exists idx_tasks_title_trgm on public.tasks using gin (title gin_trgm_ops);
create index if not exists idx_tasks_search on public.tasks using gin (
  (setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
   setweight(to_tsvector('english', coalesce(description, '')), 'B'))
);

alter table public.tasks enable row level security;
drop policy if exists "tasks_all_own" on public.tasks;
create policy "tasks_all_own"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7. TASK ↔ TAGS (junction)
-- ---------------------------------------------------------------------------
create table if not exists public.task_tags (
  task_id uuid not null references public.tasks(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (task_id, tag_id)
);

alter table public.task_tags enable row level security;
drop policy if exists "task_tags_all" on public.task_tags;
create policy "task_tags_all"
  on public.task_tags for all
  using (
    exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 8. REMINDERS
-- ---------------------------------------------------------------------------
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  task_title text not null default '',
  remind_at timestamptz not null,
  notified boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_reminders_user on public.reminders(user_id);
create index if not exists idx_reminders_task on public.reminders(task_id);
create index if not exists idx_reminders_user_time on public.reminders(user_id, remind_at);

alter table public.reminders enable row level security;
drop policy if exists "reminders_all_own" on public.reminders;
create policy "reminders_all_own"
  on public.reminders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 9. JOURNAL ENTRIES
-- ---------------------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  mood int not null default 1 check (mood between 0 and 4),
  -- The day this entry is for (used for streak and to allow multiple entries/day)
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_journal_user on public.journal_entries(user_id);
create index if not exists idx_journal_user_date on public.journal_entries(user_id, entry_date desc);

alter table public.journal_entries enable row level security;
drop policy if exists "journal_all_own" on public.journal_entries;
create policy "journal_all_own"
  on public.journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 10. HABITS + LOGS
-- ---------------------------------------------------------------------------
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  color bigint not null default 4288585374,
  icon_index int not null default 0,
  target_per_day int not null default 1,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_habits_user on public.habits(user_id);

alter table public.habits enable row level security;
drop policy if exists "habits_all_own" on public.habits;
create policy "habits_all_own"
  on public.habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  log_date date not null,
  count int not null default 1,
  done boolean not null default true,
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)
);
create index if not exists idx_habit_logs_user_date on public.habit_logs(user_id, log_date desc);
create index if not exists idx_habit_logs_habit on public.habit_logs(habit_id, log_date);

alter table public.habit_logs enable row level security;
drop policy if exists "habit_logs_all_own" on public.habit_logs;
create policy "habit_logs_all_own"
  on public.habit_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 11. DAILY PLANS
-- ---------------------------------------------------------------------------
create table if not exists public.daily_plans (
  id date primary key,                    -- 'YYYY-MM-DD'
  user_id uuid not null references auth.users(id) on delete cascade,
  mit_task_ids uuid[] not null default '{}',
  intention_text text not null default '',
  blocker_notes text not null default '',
  morning_done boolean not null default false,
  reflection_text text not null default '',
  energy_level int check (energy_level between 0 and 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_daily_plans_user on public.daily_plans(user_id, id desc);

alter table public.daily_plans enable row level security;
drop policy if exists "daily_plans_all_own" on public.daily_plans;
create policy "daily_plans_all_own"
  on public.daily_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 12. GOALS
-- ---------------------------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  color bigint not null default 4288585374,
  icon_index int not null default 0,
  target_date date,
  progress int not null default 0 check (progress between 0 and 100),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_goals_user on public.goals(user_id);

alter table public.goals enable row level security;
drop policy if exists "goals_all_own" on public.goals;
create policy "goals_all_own"
  on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 13. ENERGY LOGS (per-day check-ins)
-- ---------------------------------------------------------------------------
create table if not exists public.energy_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  level int not null check (level between 0 and 2),
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);
create index if not exists idx_energy_logs_user_date on public.energy_logs(user_id, log_date desc);

alter table public.energy_logs enable row level security;
drop policy if exists "energy_logs_all_own" on public.energy_logs;
create policy "energy_logs_all_own"
  on public.energy_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 14. updated_at TRIGGERS
-- ---------------------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'users_profile', 'projects', 'notes', 'tasks', 'habits',
      'journal_entries', 'daily_plans', 'goals', 'tags'
    ])
  loop
    execute format(
      'drop trigger if exists trg_set_updated_at on public.%I;
       create trigger trg_set_updated_at
         before update on public.%I
         for each row execute function public.tg_set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 15. REALTIME
-- ---------------------------------------------------------------------------
-- Allow the app to subscribe to changes on these tables.
do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table
  public.notes, public.tasks, public.projects, public.tags,
  public.daily_plans, public.habits, public.habit_logs,
  public.journal_entries, public.goals, public.reminders,
  public.energy_logs;

-- ---------------------------------------------------------------------------
-- 16. USEFUL VIEWS
-- ---------------------------------------------------------------------------
-- Today view: a single row per (user, date) with aggregated metrics
create or replace view public.v_today_summary
with (security_invoker = true) as
select
  p.id as user_id,
  (current_date)::date as day,
  (select count(*) from public.tasks t
    where t.user_id = p.id and t.completed = false and t.is_inbox = true) as inbox_count,
  (select count(*) from public.tasks t
    where t.user_id = p.id and t.completed = false
      and t.due_date::date = current_date) as due_today_count,
  (select count(*) from public.tasks t
    where t.user_id = p.id and t.completed = true
      and t.completed_at::date = current_date) as completed_today_count,
  (select count(*) from public.habit_logs hl
    where hl.user_id = p.id and hl.log_date = current_date and hl.done) as habits_done_today
from public.users_profile p
group by p.id;

grant select on public.v_today_summary to authenticated;

-- ---------------------------------------------------------------------------
-- 17. STORAGE (optional avatar bucket)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_select_all" on storage.objects;
create policy "avatars_select_all"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_upload_own" on storage.objects;
create policy "avatars_upload_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------------------
-- 18. HELPFUL FUNCTIONS (called from client)
-- ---------------------------------------------------------------------------
-- Recurring task rollover: when a recurring task is completed, create the
-- next instance. Call from the client right after marking the task complete.
create or replace function public.create_next_recurring_task(p_task_id uuid)
returns uuid
language plpgsql
security invoker
as $$
declare
  t public.tasks;
  next_due timestamptz;
  new_id uuid;
begin
  select * into t from public.tasks where id = p_task_id and user_id = auth.uid();
  if not found or t.recurrence = 0 then
    return null;
  end if;

  next_due := coalesce(t.due_date, now());
  next_due := case t.recurrence
    when 1 then next_due + interval '1 day'   -- daily
    when 2 then next_due + interval '7 days'  -- weekly
    when 3 then next_due + interval '1 month' -- monthly
    else next_due
  end;

  insert into public.tasks (
    user_id, title, description, priority, due_date, project_id,
    parent_id, recurrence, energy_level, estimated_minutes,
    first_step, implementation_intention, is_inbox
  ) values (
    t.user_id, t.title, t.description, t.priority, next_due, t.project_id,
    t.parent_id, t.recurrence, t.energy_level, t.estimated_minutes,
    t.first_step, t.implementation_intention, t.is_inbox
  )
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.create_next_recurring_task(uuid) to authenticated;

-- Add to daily plan (max 3 MITs)
create or replace function public.add_mit(p_date date, p_task_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  current_ids uuid[];
begin
  select mit_task_ids into current_ids
  from public.daily_plans
  where user_id = auth.uid() and id = p_date;

  current_ids := coalesce(current_ids, '{}'::uuid[]);
  if array_length(current_ids, 1) is null then
    current_ids := array[]::uuid[];
  end if;

  if not (p_task_id = any(current_ids)) and array_length(current_ids, 1) < 3 then
    current_ids := array_append(current_ids, p_task_id);
  end if;

  insert into public.daily_plans (id, user_id, mit_task_ids, morning_done)
  values (p_date, auth.uid(), current_ids, true)
  on conflict (id) do update
    set mit_task_ids = excluded.mit_task_ids,
        morning_done = true,
        updated_at = now();
end;
$$;

grant execute on function public.add_mit(date, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 19. DEFAULT GRANTS (Supabase roles)
-- ---------------------------------------------------------------------------
-- Ensure anon and authenticated can use the public schema and its objects.
-- This matters when the public schema is recreated (e.g. via drop schema public cascade).
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
