import { getDailyPlan, getTasksDueToday, getTasks, getProfile } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { TaskItem } from "@/components/task-item";
import { EnergyPicker } from "@/components/energy-picker";
import { DailyPlanForm } from "@/components/daily-plan-form";

export default async function PlanPage() {
  const [plan, dueTasks, allTasks, profile] = await Promise.all([
    getDailyPlan(),
    getTasksDueToday(),
    getTasks({ completed: false }),
    getProfile(),
  ]);
  const mitIds = plan?.mit_task_ids ?? [];
  const dueNotMit = dueTasks.filter((t) => !mitIds.includes(t.id));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <header>
        <p className="text-sm text-foreground-muted mt-1">A short ritual beats a long list. Set your intention, pick what matters, go.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card variant="ambient" className="p-5 space-y-4">
          <p className="text-2xs uppercase tracking-[0.15em] text-foreground-muted font-bold">Energy level</p>
          <EnergyPicker value={plan?.energy_level ?? profile?.energy_default} />
          <p className="text-xs text-foreground-subtle">Match your work to how you feel — not the other way around.</p>
        </Card>

        <Card variant="ambient" className="p-5 space-y-4">
          <p className="text-2xs uppercase tracking-[0.15em] text-foreground-muted font-bold">State</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted">Intention</span>
              <span className="text-foreground font-semibold">{plan?.intention_text ? "Set" : "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted">MITs</span>
              <span className="text-foreground font-semibold">{mitIds.length}/3</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted">Reflection</span>
              <span className="text-foreground font-semibold">{plan?.reflection_text ? "Done" : "—"}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card variant="ambient" className="p-5 space-y-4">
        <p className="text-2xs uppercase tracking-[0.15em] text-foreground-muted font-bold">Today&apos;s plan</p>
        <DailyPlanForm plan={plan} allTasks={allTasks} />
      </Card>

      {dueNotMit.length > 0 && (
        <Card variant="ambient" className="p-5 space-y-4">
          <p className="text-2xs uppercase tracking-[0.15em] text-foreground-muted font-bold mb-1">Also due today</p>
          <div className="space-y-2">
            {dueNotMit.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
