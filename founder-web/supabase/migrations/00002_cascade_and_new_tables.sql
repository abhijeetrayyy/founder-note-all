-- Migration: Add cascade deletes and new tables for focus sessions, weekly reviews, habit streaks, goal milestones

-- ============ CASCADE DELETES ============

-- note_tags: delete junction when note is deleted
ALTER TABLE note_tags DROP CONSTRAINT IF EXISTS fk_note_tags_note;
ALTER TABLE note_tags ADD CONSTRAINT fk_note_tags_note 
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE;

-- task_tags: delete junction when task is deleted
ALTER TABLE task_tags DROP CONSTRAINT IF EXISTS fk_task_tags_task;
ALTER TABLE task_tags ADD CONSTRAINT fk_task_tags_task 
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- habit_logs: delete logs when habit is deleted
ALTER TABLE habit_logs DROP CONSTRAINT IF EXISTS fk_habit_logs_habit;
ALTER TABLE habit_logs ADD CONSTRAINT fk_habit_logs_habit 
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE;

-- reminders: delete when task is deleted
ALTER TABLE reminders DROP CONSTRAINT IF EXISTS fk_reminders_task;
ALTER TABLE reminders ADD CONSTRAINT fk_reminders_task 
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- habit_logs unique constraint (prevent duplicate toggles)
ALTER TABLE habit_logs DROP CONSTRAINT IF EXISTS habit_logs_habit_date_unique;
ALTER TABLE habit_logs ADD CONSTRAINT habit_logs_habit_date_unique 
  UNIQUE (habit_id, log_date);


-- ============ NEW TABLES ============

-- Focus sessions (persisted pomodoro/deep work/sprint sessions)
CREATE TABLE IF NOT EXISTS focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  mode text NOT NULL CHECK (mode IN ('pomodoro', 'deep_work', 'quick_sprint')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_minutes integer,
  completed boolean DEFAULT false,
  pause_duration_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
-- Postgres has no IF NOT EXISTS for CREATE POLICY; drop-then-create is the
-- re-runnable idiom, and is what supabase/schema.sql already uses.
DROP POLICY IF EXISTS "Users can manage own focus sessions" ON focus_sessions;
CREATE POLICY "Users can manage own focus sessions" ON focus_sessions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON focus_sessions(user_id, created_at DESC);


-- Weekly reviews (saved review answers)
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  accomplishments text DEFAULT '',
  challenges text DEFAULT '',
  next_priorities text DEFAULT '',
  habits_adjustment text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own weekly reviews" ON weekly_reviews;
CREATE POLICY "Users can manage own weekly reviews" ON weekly_reviews
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user ON weekly_reviews(user_id, week_start DESC);


-- Habit streaks (cache table, recomputed on toggle)
CREATE TABLE IF NOT EXISTS habit_streaks (
  habit_id uuid PRIMARY KEY REFERENCES habits(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  last_log_date date,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE habit_streaks ENABLE ROW LEVEL SECURITY;
-- SELECT-only, so there is no WITH CHECK to add: WITH CHECK applies to rows
-- being written, and this policy never permits a write.
DROP POLICY IF EXISTS "Users can view own habit streaks" ON habit_streaks;
CREATE POLICY "Users can view own habit streaks" ON habit_streaks FOR SELECT USING (
  EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_streaks.habit_id AND habits.user_id = auth.uid())
);


-- Goal milestones (sub-tasks for goals)
CREATE TABLE IF NOT EXISTS goal_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own goal milestones" ON goal_milestones;
CREATE POLICY "Users can manage own goal milestones" ON goal_milestones FOR ALL USING (
  EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_milestones.goal_id AND goals.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_milestones.goal_id AND goals.user_id = auth.uid())
);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal ON goal_milestones(goal_id, sort_order);
