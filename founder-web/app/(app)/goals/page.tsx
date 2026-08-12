import { getGoals, getMilestonesForGoals } from "@/lib/data";
import { Card, SectionLabel, EmptyState } from "@/components/ui/card";
import { CreateGoalButton } from "@/components/create-goal-button";
import { GoalClient } from "./goal-client";

export default async function GoalsPage() {
  const goals = await getGoals();
  // One query for every goal's milestones, not one query per goal.
  const milestonesMap = await getMilestonesForGoals(goals.map((g) => g.id));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-foreground-muted mt-1">Track what matters over the next 90 days.</p>
        </div>
        <CreateGoalButton />
      </header>

      <Card variant="ambient" className="p-5 space-y-4">
        <SectionLabel>Active goals ({goals.length})</SectionLabel>
        {goals.length ? (
          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalClient key={goal.id} goal={goal} milestones={milestonesMap.get(goal.id) ?? []} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>}
            title="No goals yet"
            subtitle="Set a north star and break it into milestones you can chip away at."
          />
        )}
      </Card>
    </div>
  );
}
