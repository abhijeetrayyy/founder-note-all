import { getGoals } from "@/lib/data";
import { Card, SectionLabel } from "@/components/ui/card";
import { GoalCard } from "@/components/goal-card";
import { CreateGoalButton } from "@/components/create-goal-button";

export default async function GoalsPage() {
  const goals = await getGoals();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Goals</h1>
          <p className="text-text-muted dark:text-dark-text-muted mt-1">Track what matters over the next 90 days.</p>
        </div>
        <CreateGoalButton />
      </header>

      <Card className="p-5 space-y-4">
        <SectionLabel>ACTIVE GOALS ({goals.length})</SectionLabel>
        {goals.length ? (
          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted dark:text-dark-text-muted">No goals yet. Set a goal and track progress.</p>
        )}
      </Card>
    </div>
  );
}
