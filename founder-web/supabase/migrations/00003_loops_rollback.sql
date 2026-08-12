-- Rollback for 00003_loops.sql
--
-- Run this only if you need to undo the loop migration. It is written to be
-- safe to run twice.
--
-- Note on the backfill: 00003 set `answered_at` on every already-triaged task.
-- Before that migration every row had answered_at = NULL, so clearing the whole
-- column restores the previous state exactly — provided nothing has been
-- triaged in the app since. If it has, those answers are lost too, which is
-- the one genuinely lossy part of going back.

-- 1. Restore the previous today-summary view (no released_at filter).
CREATE OR REPLACE VIEW public.v_today_summary
WITH (security_invoker = true) AS
SELECT
  p.id AS user_id,
  (current_date)::date AS day,
  (SELECT count(*) FROM public.tasks t
    WHERE t.user_id = p.id AND t.completed = false AND t.is_inbox = true) AS inbox_count,
  (SELECT count(*) FROM public.tasks t
    WHERE t.user_id = p.id AND t.completed = false
      AND t.due_date::date = current_date) AS due_today_count,
  (SELECT count(*) FROM public.tasks t
    WHERE t.user_id = p.id AND t.completed = true
      AND t.completed_at::date = current_date) AS completed_today_count,
  (SELECT count(*) FROM public.habit_logs hl
    WHERE hl.user_id = p.id AND hl.log_date = current_date AND hl.done) AS habits_done_today
FROM public.users_profile p;

GRANT SELECT ON public.v_today_summary TO authenticated;

-- 2. Drop what the migration added.
DROP VIEW IF EXISTS public.v_loop_pressure;
DROP FUNCTION IF EXISTS public.release_stale_loops(int, text);
DROP FUNCTION IF EXISTS public.purge_released_loops();

DROP INDEX IF EXISTS public.idx_tasks_owed;
DROP INDEX IF EXISTS public.idx_tasks_raw_age;
DROP INDEX IF EXISTS public.idx_tasks_released;
DROP INDEX IF EXISTS public.idx_tasks_anti;

-- 3. Un-release anything the app soft-dropped, so no task is left hidden by a
--    column that is about to disappear.
UPDATE public.tasks SET released_at = NULL, release_reason = '' WHERE released_at IS NOT NULL;

ALTER TABLE public.tasks
  DROP COLUMN IF EXISTS owed_to,
  DROP COLUMN IF EXISTS owed_direction,
  DROP COLUMN IF EXISTS kind,
  DROP COLUMN IF EXISTS decide_by,
  DROP COLUMN IF EXISTS decision_unlock,
  DROP COLUMN IF EXISTS answered_at,
  DROP COLUMN IF EXISTS released_at,
  DROP COLUMN IF EXISTS release_reason,
  DROP COLUMN IF EXISTS not_this_week,
  DROP COLUMN IF EXISTS anti_reason;
