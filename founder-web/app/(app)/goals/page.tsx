import { getGoals, getGoalMilestones } from "@/lib/data";
import { Card, SectionLabel } from "@/components/ui/card";
import { CreateGoalButton } from "@/components/create-goal-button";
import { GoalClient } from "./goal-client";

export default async function GoalsPage() {
  const goals = await getGoals();
  const milestonesMap = new Map(
    await Promise.all(goals.map(async (g) => [g.id, await getGoalMilestones(g.id)] as const))
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight font-display">Goals</h1>
          <p className="text-sm text-foreground-muted">{goals.length ? "Track what matters over the next 90 days." : "Set a north star and break it into milestones."}</p>
        </div>
        <CreateGoalButton />
      </header>

      <Card variant={goals.length ? "ambient" : "focused"} className="p-5 space-y-5">
        <SectionLabel>Active goals ({goals.length})</SectionLabel>
        {goals.length ? (
          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalClient key={goal.id} goal={goal} milestones={milestonesMap.get(goal.id) ?? []} />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent-muted flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
            </div>
            <p className="text-sm text-foreground-muted mb-1">Define the outcomes your daily work serves.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
