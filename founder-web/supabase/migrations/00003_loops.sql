-- Migration: the loop model
--
-- Turns `tasks` into loops. A loop is anything unresolved — a task, a decision,
-- or an obligation to a person. Three ideas land here:
--
--   1. Owed        — a loop can have a person attached, in one of two directions.
--   2. Decisions   — a decision is not a task and is never offered as one.
--   3. Answered    — a loop that has been triaged is a plan, not pressure.
--                    This is what lets capture stay free: an untriaged capture
--                    costs nothing for its first week, and only then starts to age.
--
-- Nothing here is destructive. Release is a soft drop with a restore window.

-- ============ LOOP FIELDS ON TASKS ============

ALTER TABLE public.tasks
  -- Who is waiting. owed_direction: 0 = they are waiting on you, 1 = you are
  -- waiting on them. Only meaningful when owed_to is non-empty.
  ADD COLUMN IF NOT EXISTS owed_to text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS owed_direction smallint NOT NULL DEFAULT 0
    CHECK (owed_direction BETWEEN 0 AND 1),

  -- kind: 0 = task, 1 = decision. A decision never asks "do it now" — it asks
  -- when you will know enough, and what would make the answer obvious.
  ADD COLUMN IF NOT EXISTS kind smallint NOT NULL DEFAULT 0
    CHECK (kind BETWEEN 0 AND 1),
  ADD COLUMN IF NOT EXISTS decide_by date,
  ADD COLUMN IF NOT EXISTS decision_unlock text NOT NULL DEFAULT '',

  -- The loop has been given an answer (do / schedule / hand off / drop).
  -- NULL means it is still raw. Age is only counted against raw loops.
  ADD COLUMN IF NOT EXISTS answered_at timestamptz,

  -- Soft drop. Released loops are hidden everywhere but restorable for 30 days.
  ADD COLUMN IF NOT EXISTS released_at timestamptz,
  ADD COLUMN IF NOT EXISTS release_reason text NOT NULL DEFAULT '',

  -- The anti-list: named out loud so it stops following you around.
  ADD COLUMN IF NOT EXISTS not_this_week boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anti_reason text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.tasks.answered_at IS
  'When this loop was triaged. NULL = raw. Decay is measured from created_at only while this is NULL.';
COMMENT ON COLUMN public.tasks.released_at IS
  'Soft drop. Hidden from every surface, restorable for 30 days. Never hard-delete on the user''s behalf.';

-- ============ BACKFILL ============
--
-- Every task that already left the inbox has, by definition, been triaged.
-- Marking them answered is what stops existing users from opening the app to a
-- wall of "rotting" the first time this ships — which would be exactly the
-- toll booth this model exists to avoid.

UPDATE public.tasks
   SET answered_at = COALESCE(updated_at, created_at)
 WHERE answered_at IS NULL
   AND is_inbox = false;

-- ============ INDEXES ============

CREATE INDEX IF NOT EXISTS idx_tasks_owed
  ON public.tasks (user_id, owed_direction)
  WHERE owed_to <> '' AND completed = false AND released_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_raw_age
  ON public.tasks (user_id, created_at)
  WHERE answered_at IS NULL AND completed = false AND released_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_released
  ON public.tasks (user_id, released_at)
  WHERE released_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_anti
  ON public.tasks (user_id)
  WHERE not_this_week = true AND completed = false AND released_at IS NULL;

-- ============ PRESSURE ============
--
-- Deliberately not a score. Four counts, each attached to a place you can go
-- and a thing you can do. Capture cannot raise any of them: a raw loop is
-- invisible here until it has been ignored for a full week.

CREATE OR REPLACE VIEW public.v_loop_pressure
WITH (security_invoker = true) AS
SELECT
  p.id AS user_id,

  -- People waiting on you. No age grace — a person waiting three days
  -- outweighs a task rotting for thirty.
  (SELECT count(*) FROM public.tasks t
    WHERE t.user_id = p.id
      AND t.completed = false AND t.released_at IS NULL
      AND t.owed_to <> '' AND t.owed_direction = 0) AS owed_count,

  -- You are blocked on someone else. Feeds the daily unblock batch.
  (SELECT count(*) FROM public.tasks t
    WHERE t.user_id = p.id
      AND t.completed = false AND t.released_at IS NULL
      AND t.owed_to <> '' AND t.owed_direction = 1) AS blocked_count,

  -- Raw for 14 days or more. These are the ones the list cannot shrink past.
  (SELECT count(*) FROM public.tasks t
    WHERE t.user_id = p.id
      AND t.completed = false AND t.released_at IS NULL
      AND t.answered_at IS NULL
      AND t.created_at < now() - interval '14 days') AS rotting_count,

  -- Raw for 7–13 days. Aging, not yet rotting.
  (SELECT count(*) FROM public.tasks t
    WHERE t.user_id = p.id
      AND t.completed = false AND t.released_at IS NULL
      AND t.answered_at IS NULL
      AND t.created_at < now() - interval '7 days'
      AND t.created_at >= now() - interval '14 days') AS aging_count,

  -- Committed to a day, but with no first move written. These are the loops
  -- that will not start, and they are the quiet reason a plan fails.
  (SELECT count(*) FROM public.tasks t
    WHERE t.user_id = p.id
      AND t.completed = false AND t.released_at IS NULL
      AND t.is_inbox = false
      AND t.due_date IS NOT NULL
      AND btrim(t.first_step) = '') AS unclear_count

FROM public.users_profile p;

GRANT SELECT ON public.v_loop_pressure TO authenticated;

-- ============ RELEASE ============
--
-- Friday amnesty. Releases every raw loop past `p_older_than_days`, returns
-- what it let go so the app can show a receipt rather than silently deleting.
-- One click, thirty days of undo — because dropping has to be cheaper than
-- keeping, or the list only ever grows.

CREATE OR REPLACE FUNCTION public.release_stale_loops(
  p_older_than_days int DEFAULT 21,
  p_reason text DEFAULT 'amnesty'
)
-- Output columns are named loop_id/loop_title rather than id/title: in a
-- LANGUAGE sql function the RETURNS TABLE names participate in name resolution
-- and would be ambiguous against tasks.id / tasks.title.
RETURNS TABLE (loop_id uuid, loop_title text)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE public.tasks t
     SET released_at = now(),
         release_reason = p_reason,
         updated_at = now()
   WHERE t.user_id = auth.uid()
     AND t.completed = false
     AND t.released_at IS NULL
     AND t.answered_at IS NULL
     AND t.created_at < now() - make_interval(days => p_older_than_days)
  RETURNING t.id, t.title;
$$;

GRANT EXECUTE ON FUNCTION public.release_stale_loops(int, text) TO authenticated;

-- Purge releases past the restore window. Intended for a scheduled job; it is
-- the only path that hard-deletes, and only after 30 days of being restorable.
CREATE OR REPLACE FUNCTION public.purge_released_loops()
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  WITH gone AS (
    DELETE FROM public.tasks
     WHERE user_id = auth.uid()
       AND released_at IS NOT NULL
       AND released_at < now() - interval '30 days'
    RETURNING 1
  )
  SELECT count(*) INTO n FROM gone;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_released_loops() TO authenticated;

-- ============ TODAY SUMMARY ============
--
-- Released loops must not be counted anywhere. Rebuilt with that filter, and
-- with the completion counts left intact for the review surfaces that still
-- legitimately need them (evidence on Friday, not a score in the chrome).

CREATE OR REPLACE VIEW public.v_today_summary
WITH (security_invoker = true) AS
SELECT
  p.id AS user_id,
  (current_date)::date AS day,
  (SELECT count(*) FROM public.tasks t
    WHERE t.user_id = p.id AND t.completed = false
      AND t.released_at IS NULL AND t.is_inbox = true) AS inbox_count,
  (SELECT count(*) FROM public.tasks t
    WHERE t.user_id = p.id AND t.completed = false
      AND t.released_at IS NULL
      AND t.due_date::date = current_date) AS due_today_count,
  (SELECT count(*) FROM public.tasks t
    WHERE t.user_id = p.id AND t.completed = true
      AND t.released_at IS NULL
      AND t.completed_at::date = current_date) AS completed_today_count,
  (SELECT count(*) FROM public.habit_logs hl
    WHERE hl.user_id = p.id AND hl.log_date = current_date AND hl.done) AS habits_done_today
FROM public.users_profile p;

GRANT SELECT ON public.v_today_summary TO authenticated;
