import { getDailyPlan, getTasksDueToday, getProfile } from "@/lib/data";
import { todayKey } from "@/lib/utils";
import { Card, SectionLabel } from "@/components/ui/card";
import { TaskItem } from "@/components/task-item";
import { EnergyPicker } from "@/components/energy-picker";
import { DailyPlanForm } from "@/components/daily-plan-form";

export default async function PlanPage() {
  const [plan, tasks, profile] = await Promise.all([getDailyPlan(), getTasksDueToday(), getProfile()]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold">Daily Planning</h1>
        <p className="text-text-muted dark:text-dark-text-muted mt-1">Set your intention and pick today&apos;s MITs.</p>
      </header>

      <Card className="p-5 space-y-4">
        <SectionLabel>ENERGY</SectionLabel>
        <EnergyPicker value={plan?.energy_level ?? profile?.energy_default} />
      </Card>

      <Card className="p-5 space-y-4">
        <SectionLabel>TODAY&apos;S INTENTION</SectionLabel>
        <DailyPlanForm plan={plan} />
      </Card>

      <Card className="p-5 space-y-4">
        <SectionLabel>DUE TODAY — MARK MITS BY SETTING HIGH PRIORITY</SectionLabel>
        {tasks.length ? (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted dark:text-dark-text-muted">No tasks due today. Create tasks from Quick Add or the Tasks page.</p>
        )}
      </Card>
    </div>
  );
}
