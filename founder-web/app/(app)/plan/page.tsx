import { getDailyPlan, getOpenLoops, getTasksByIds, getProfile, getEnergyLog, getGoals } from "@/lib/data";
import { todayKey } from "@/lib/utils";
import { readPrefs, byLane, type Lane } from "@/lib/loops";
import { PlanBoard } from "./plan-board";

/**
 * Plan the day.
 *
 * This page used to be four settings cards and a scrolling list capped at
 * twelve tasks, which is the opposite of what a founder needs at 9am. They do
 * not want to browse their backlog; they want the whole of it in front of them
 * once, sorted by what actually bites, so they can commit to three things and
 * shut the rest up for the day.
 *
 * So: everything open, on one screen, in four computed lanes — on fire, moves
 * the needle, been sitting, noise — with the reason each thing landed where it
 * did. Picking is one tap. The nav badge says 60 seconds and this is now a
 * screen where that is true.
 */
export default async function PlanPage() {
  const today = todayKey();
  const [plan, open, profile, energy, goals] = await Promise.all([
    getDailyPlan(),
    getOpenLoops(),
    getProfile(),
    getEnergyLog(),
    getGoals(),
  ]);

  const pickIds = plan?.mit_task_ids ?? [];
  const picks = await getTasksByIds(pickIds);

  // Lanes are decided here, on the server, not in the board.
  // `laneOf` reads the clock ("waiting 4 days", "due 2 days ago"), and a client
  // that recomputed it would render different text than the HTML it hydrated
  // into whenever the two machines disagree about the date — which, for a
  // founder working late or travelling, is most of the time.
  const grouped = byLane(open, today);
  const laneById: Record<string, { lane: Lane; why: string }> = {};
  for (const key of Object.keys(grouped) as Lane[]) {
    for (const { task, why } of grouped[key]) laneById[task.id] = { lane: key, why };
  }

  return (
    <PlanBoard
      today={today}
      lanes={(Object.keys(grouped) as Lane[]).map((k) => ({ key: k, items: grouped[k].map((i) => i.task) }))}
      laneById={laneById}
      picks={picks}
      intention={plan?.intention_text ?? ""}
      energy={energy?.level ?? profile?.energy_default ?? 1}
      capacity={readPrefs(profile?.preferences).capacity}
      goals={goals.map((g) => ({ id: g.id, title: g.title }))}
    />
  );
}
