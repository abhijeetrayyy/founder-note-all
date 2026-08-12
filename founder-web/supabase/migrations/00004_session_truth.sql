-- Migration: energy truth
--
-- A focus session already records what was planned. These two columns record
-- what actually happened, which is the only way the app can ever say something
-- like "your deep blocks land on Tuesday and Thursday; Mondays never work".
--
-- Without `felt`, every capacity number in the product is an assumption that
-- can never be corrected by evidence.

ALTER TABLE public.focus_sessions
  -- 0 = flow, 1 = solid, 2 = fought it, 3 = wrong task for this energy
  ADD COLUMN IF NOT EXISTS felt smallint CHECK (felt BETWEEN 0 AND 3),
  -- The one line written at pre-flight. Comparing it to what got done is the
  -- cheapest honest signal we have about whether a block worked.
  ADD COLUMN IF NOT EXISTS intention text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.focus_sessions.felt IS
  'How the block actually felt, logged at session end. Feeds the planned-vs-real comparison on Pulse.';

CREATE INDEX IF NOT EXISTS idx_focus_sessions_felt
  ON public.focus_sessions (user_id, felt)
  WHERE felt IS NOT NULL;
