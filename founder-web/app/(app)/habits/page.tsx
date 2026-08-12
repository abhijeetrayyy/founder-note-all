import { getHabits, getHabitLogsForDate } from "@/lib/data";
import { Card, SectionLabel, Meter, EmptyState } from "@/components/ui/card";
import { HabitClient } from "./habit-client";
import { CreateHabitButton } from "@/components/create-habit-button";
import { getLastNLogs } from "@/lib/habit-streaks";

export default async function HabitsPage() {
  const [habits, todayLogs] = await Promise.all([getHabits(), getHabitLogsForDate()]);
  const habitStreaks = await getLastNLogs(habits.map((h) => h.id), 60);
  const doneToday = todayLogs.filter((l) => l.done).length;
  const bestStreak = Math.max(0, ...Array.from(habitStreaks.values()));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-foreground-muted mt-1">Build consistency one day at a time.</p>
        </div>
        <CreateHabitButton />
      </header>

      {habits.length > 0 && (
        <Card variant="ambient" className="p-5 flex items-center gap-4">
          <Meter value={habits.length ? doneToday / habits.length : 0} size={52} strokeWidth={5}>
            <span className="text-xs font-extrabold text-accent number-mono">{doneToday}/{habits.length}</span>
          </Meter>
          <div>
            <p className="text-sm font-bold text-foreground">{doneToday === habits.length ? "All done for today" : "Today's rituals"}</p>
            {bestStreak > 0 && <p className="text-xs text-foreground-muted mt-0.5">🔥 Best streak: {bestStreak} {bestStreak === 1 ? "day" : "days"}</p>}
          </div>
        </Card>
      )}

      <Card variant="ambient" className="p-5 space-y-3">
        <SectionLabel>Today</SectionLabel>
        {habits.length ? (
          <div className="space-y-2">
            {habits.map((habit) => (
              <HabitClient
                key={habit.id}
                habit={habit}
                log={todayLogs.find((l) => l.habit_id === habit.id)}
                streak={habitStreaks.get(habit.id) ?? 0}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>}
            title="No habits yet"
            subtitle="Create one to start building a streak — small and consistent beats big and occasional."
          />
        )}
      </Card>
    </div>
  );
}
