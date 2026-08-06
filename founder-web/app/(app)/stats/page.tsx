import { getStats } from "@/lib/data";
import { Card, Meter } from "@/components/ui/card";
import { EnergyChart } from "./energy-chart";

export default async function StatsPage() {
  const stats = await getStats();
  const avgEnergy = stats.energyThisWeek.length
    ? (stats.energyThisWeek.reduce((a, b) => a + b, 0) / stats.energyThisWeek.length).toFixed(1)
    : "—";
  const rateStory = stats.completionRate >= 70
    ? "You're closing the loop on most of what you start. That's real momentum."
    : stats.completionRate >= 40
    ? "Steady progress. A couple more finished tasks a day compounds fast."
    : stats.totalTasks > 0
    ? "Every list starts messy. Pick one thing from Right Now and finish it."
    : "Capture your first task and watch this fill in.";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-foreground tracking-tight font-display">Pulse</h1>
        <p className="text-sm text-foreground-muted mt-1">Your momentum, made visible.</p>
      </header>

      <Card variant="focused" className="p-6 flex items-center gap-6">
        <Meter value={stats.completionRate / 100} size={84} strokeWidth={7}>
          <span className="text-xl font-extrabold text-foreground number-mono">{stats.completionRate}%</span>
        </Meter>
        <div>
          <p className="text-sm font-bold text-foreground">{stats.completedTasks} of {stats.totalTasks} tasks completed, all time</p>
          <p className="text-sm text-foreground-muted mt-1 leading-relaxed">{rateStory}</p>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Done today" value={String(stats.completedToday)} hex="#F59E0B" />
        <StatCard label="Habits this week" value={String(stats.habitsThisWeek)} hex="#3B82F6" />
        <StatCard label="Avg energy" value={String(avgEnergy)} hex="#7C3AED" />
        <StatCard label="Total tasks" value={String(stats.totalTasks)} hex="#14B8A6" />
        <StatCard label="Completed" value={String(stats.completedTasks)} hex="#10B981" />
        <StatCard label="Completion rate" value={`${stats.completionRate}%`} hex="#6C5CE7" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="ambient" className="p-5 space-y-4">
          <p className="text-2xs uppercase tracking-[0.15em] text-foreground-muted font-bold">Energy this week</p>
          {stats.energyThisWeek.length ? (
            <EnergyChart levels={stats.energyThisWeek} />
          ) : (
            <p className="text-sm text-foreground-muted italic py-8 text-center">No check-ins yet. Set your energy on Right Now or Plan.</p>
          )}
        </Card>

        <Card variant="ambient" className="p-5 space-y-3">
          <p className="text-2xs uppercase tracking-[0.15em] text-foreground-muted font-bold">Done per day</p>
          {stats.completionByDay ? (
            <div className="grid grid-cols-7 gap-2">
              {stats.completionByDay.map((d, i) => {
                const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
                const max = Math.max(...stats.completionByDay, 1);
                const pct = (d / max) * 100;
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-foreground-muted number-mono">{d}</span>
                    <div className="w-full h-20 rounded-lg bg-base-overlay relative overflow-hidden">
                      <div className="absolute bottom-0 w-full rounded-b-lg transition-all duration-500" style={{ height: `${Math.max(pct, 4)}%`, background: d > 0 ? "linear-gradient(to top, #7C3AED, #A78BFA)" : "transparent" }} />
                    </div>
                    <span className="text-2xs text-foreground-subtle font-semibold">{days[i]}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-foreground-muted italic">No completed tasks this week.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, hex }: { label: string; value: string; hex: string }) {
  return (
    <div className="rounded-2xl glass-ambient p-4 transition-all duration-300 hover:-translate-y-0.5">
      <p className="text-2xl font-extrabold tabular-nums mb-1 number-mono" style={{ color: hex }}>{value}</p>
      <p className="text-xs font-semibold text-foreground-muted">{label}</p>
    </div>
  );
}
