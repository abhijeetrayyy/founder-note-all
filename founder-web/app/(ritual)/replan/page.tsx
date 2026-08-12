import { getDailyPlan, getTasksDueToday } from "@/lib/data";
import { ReplanClient } from "./replan-client";

export default async function ReplanPage() {
  const [plan, dueToday] = await Promise.all([getDailyPlan(), getTasksDueToday()]);

  const mitIds = plan?.mit_task_ids ?? [];
  // Only what is still open. Completed work is not something to reshape, and
  // listing it here would turn a re-entry into a scorecard.
  const stillOpen = dueToday.filter((t) => !t.completed && mitIds.includes(t.id));
  const fallback = dueToday.filter((t) => !t.completed).slice(0, 3);

  const hoursAway = plan?.updated_at
    ? (Date.now() - new Date(plan.updated_at).getTime()) / 3_600_000
    : 0;

  return <ReplanClient mits={stillOpen.length ? stillOpen : fallback} hoursAway={hoursAway} />;
}
