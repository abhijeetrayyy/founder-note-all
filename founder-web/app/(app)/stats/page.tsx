import { getStats } from "@/lib/data";
import { Card, Meter } from "@/components/ui/card";
import { EnergyChart } from "./energy-chart";

export default async function StatsPage() {
  const stats = await getStats();
  const avgEnergy = stats.energyThisWeek.length
    ? (stats.energyThisWeek.reduce((a, b) => a + b, 0) / stats.energyThisWeek.length).toFixed(1)
    : "—";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight font-display">Pulse</h1>
        <p className="text-sm text-foreground-muted">Your momentum, made visible.</p>
      </header>

      <Card variant="focused" className="p-6 flex items-center gap-6">
        <Meter value={stats.completionRate / 100} size={88} strokeWidth={7}>
          <span className="text-xl font-extrabold text-foreground number-mono">{stats.completionRate}%</span>
        </Meter>
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">{stats.completedTasks} of {stats.totalTasks} tasks completed</p>
          <p className="text-xs text-foreground-muted leading-relaxed">
            {stats.completionRate >= 70 ? "You're closing the loop. Real momentum." :
             stats.completionRate >= 40 ? "Steady progress — a few more finished tasks compounds fast." :
             stats.totalTasks > 0 ? "Every list starts messy. Pick one thing and finish it." :
             "Capture your first task and watch this fill in."}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Done today", value: String(stats.completedToday), hex: "#10B981" },
          { label: "Habits this week", value: String(stats.habitsThisWeek), hex: "#3B82F6" },
          { label: "Avg energy", value: String(avgEnergy), hex: "#8B5CF6" },
          { label: "Total tasks", value: String(stats.totalTasks), hex: "#14B8A6" },
          { label: "Completed", value: String(stats.completedTasks), hex: "#10B981" },
          { label: "Rate", value: `${stats.completionRate}%`, hex: "#7C3AED" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl glass-ambient p-4 transition-all duration-300 hover:glass-active hover:-translate-y-0.5">
            <p className="text-2xl font-extrabold number-mono mb-1" style={{ color: s.hex }}>{s.value}</p>
            <p className="text-xs font-semibold text-foreground-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="ambient" className="p-5 space-y-4">
          <p className="text-2xs uppercase tracking-[0.15em] text-foreground-muted font-bold">Energy this week</p>
          {stats.energyThisWeek.length ? (
            <EnergyChart levels={stats.energyThisWeek} />
          ) : (
            <p className="text-sm text-foreground-muted py-8 text-center">No energy check-ins yet.</p>
          )}
        </Card>

        <Card variant="ambient" className="p-5 space-y-4">
          <p className="text-2xs uppercase tracking-[0.15em] text-foreground-muted font-bold">Done per day</p>
          {stats.completionByDay ? (
            <div className="grid grid-cols-7 gap-2">
              {stats.completionByDay.map((d, i) => {
                const days = ["Su","Mo","Tu","We","Th","Fr","Sa"];
                const max = Math.max(...stats.completionByDay, 1);
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-foreground-muted number-mono">{d}</span>
                    <div className="w-full h-20 rounded-lg bg-base-overlay relative overflow-hidden">
                      <div className="absolute bottom-0 w-full rounded-b-lg transition-all duration-500" style={{ height: `${Math.max((d/max)*100, 4)}%`, background: d > 0 ? "linear-gradient(to top, #7C3AED, #A78BFA)" : "transparent" }} />
                    </div>
                    <span className="text-2xs text-foreground-subtle font-semibold">{days[i]}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-foreground-muted py-8 text-center">No completed tasks this week.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
