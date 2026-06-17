import { getStats } from "@/lib/data";
import { Card, SectionLabel } from "@/components/ui/card";

export default async function StatsPage() {
  const stats = await getStats();
  const avgEnergy = stats.energyThisWeek.length
    ? (stats.energyThisWeek.reduce((a, b) => a + b, 0) / stats.energyThisWeek.length).toFixed(1)
    : "—";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold">Stats</h1>
        <p className="text-text-muted dark:text-dark-text-muted mt-1">Your execution metrics at a glance.</p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Completion rate" value={`${stats.completionRate}%`} />
        <StatCard label="Total tasks" value={String(stats.totalTasks)} />
        <StatCard label="Completed" value={String(stats.completedTasks)} />
        <StatCard label="Done today" value={String(stats.completedToday)} />
        <StatCard label="Habit logs (week)" value={String(stats.habitsThisWeek)} />
        <StatCard label="Avg energy (week)" value={avgEnergy} />
      </div>

      <Card className="p-5 space-y-4">
        <SectionLabel>ENERGY THIS WEEK</SectionLabel>
        {stats.energyThisWeek.length ? (
          <div className="flex items-end gap-2 h-32">
            {stats.energyThisWeek.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-lg bg-primary/80 hover:bg-primary transition"
                style={{ height: `${((v + 1) / 3) * 100}%` }}
                title={`Energy level ${v}`}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted dark:text-dark-text-muted">No energy check-ins this week.</p>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-3xl font-extrabold">{value}</p>
      <p className="text-xs font-bold text-text-muted dark:text-dark-text-muted mt-1">{label}</p>
    </div>
  );
}
