-- Migration: Enable RLS on all tables and add performance indexes
-- Run in Supabase SQL editor or via `supabase db push`

-- ============ ROW LEVEL SECURITY ============

ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_logs ENABLE ROW LEVEL SECURITY;

-- Per-table policies (user-scoped data)
-- Template: auth.uid() = user_id for SELECT/INSERT/UPDATE/DELETE

-- users_profile
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can select own profile') THEN
    CREATE POLICY "Users can select own profile" ON users_profile FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON users_profile FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON users_profile FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- projects
CREATE POLICY IF NOT EXISTS "Users can select own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- tags
CREATE POLICY IF NOT EXISTS "Users can select own tags" ON tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own tags" ON tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own tags" ON tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own tags" ON tags FOR DELETE USING (auth.uid() = user_id);

-- notes
CREATE POLICY IF NOT EXISTS "Users can select own notes" ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own notes" ON notes FOR DELETE USING (auth.uid() = user_id);

-- note_tags (junction — check via parent note)
CREATE POLICY IF NOT EXISTS "Users can select own note_tags" ON note_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "Users can insert own note_tags" ON note_tags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "Users can delete own note_tags" ON note_tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid())
);

-- tasks
CREATE POLICY IF NOT EXISTS "Users can select own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- task_tags (junction — check via parent task)
CREATE POLICY IF NOT EXISTS "Users can select own task_tags" ON task_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "Users can insert own task_tags" ON task_tags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "Users can delete own task_tags" ON task_tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid())
);

-- journal_entries
CREATE POLICY IF NOT EXISTS "Users can select own journal" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own journal" ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own journal" ON journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own journal" ON journal_entries FOR DELETE USING (auth.uid() = user_id);

-- habits
CREATE POLICY IF NOT EXISTS "Users can select own habits" ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own habits" ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own habits" ON habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own habits" ON habits FOR DELETE USING (auth.uid() = user_id);

-- habit_logs
CREATE POLICY IF NOT EXISTS "Users can select own habit_logs" ON habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own habit_logs" ON habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own habit_logs" ON habit_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own habit_logs" ON habit_logs FOR DELETE USING (auth.uid() = user_id);

-- daily_plans
CREATE POLICY IF NOT EXISTS "Users can select own daily_plans" ON daily_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own daily_plans" ON daily_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own daily_plans" ON daily_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own daily_plans" ON daily_plans FOR DELETE USING (auth.uid() = user_id);

-- goals
CREATE POLICY IF NOT EXISTS "Users can select own goals" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own goals" ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own goals" ON goals FOR DELETE USING (auth.uid() = user_id);

-- energy_logs
CREATE POLICY IF NOT EXISTS "Users can select own energy_logs" ON energy_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own energy_logs" ON energy_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own energy_logs" ON energy_logs FOR UPDATE USING (auth.uid() = user_id);

-- reminders
CREATE POLICY IF NOT EXISTS "Users can select own reminders" ON reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own reminders" ON reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own reminders" ON reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own reminders" ON reminders FOR DELETE USING (auth.uid() = user_id);


-- ============ PERFORMANCE INDEXES ============

-- tasks (most heavily queried table)
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed_due ON tasks(user_id, completed, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_inbox_completed ON tasks(user_id, is_inbox, completed);
CREATE INDEX IF NOT EXISTS idx_tasks_user_project ON tasks(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at) WHERE completed = true;

-- habit_logs
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON habit_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, log_date);

-- notes
CREATE INDEX IF NOT EXISTS idx_notes_user_archived_pinned ON notes(user_id, is_archived, is_pinned DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user_project ON notes(user_id, project_id);

-- journal_entries
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON journal_entries(user_id, entry_date);

-- energy_logs
CREATE INDEX IF NOT EXISTS idx_energy_user_date ON energy_logs(user_id, log_date);

-- junction tables
CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag ON task_tags(tag_id);

-- daily_plans
CREATE INDEX IF NOT EXISTS idx_daily_plans_user ON daily_plans(user_id);
