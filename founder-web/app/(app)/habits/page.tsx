import { getHabits, getHabitLogsForDate } from "@/lib/data";
import { Card, SectionLabel, Meter } from "@/components/ui/card";
import { HabitClient } from "./habit-client";
import { CreateHabitButton } from "@/components/create-habit-button";
import { getLastNLogs } from "@/lib/habit-streaks";

export default async function HabitsPage() {
  const [habits, todayLogs] = await Promise.all([getHabits(), getHabitLogsForDate()]);
  const habitStreaks = await getLastNLogs(habits.map((h) => h.id), 60);
  const doneToday = todayLogs.filter((l) => l.done).length;
  const bestStreak = Math.max(0, ...Array.from(habitStreaks.values()));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight font-display">Rituals</h1>
          <p className="text-sm text-foreground-muted">Build consistency one day at a time.</p>
        </div>
        <CreateHabitButton />
      </header>

      {habits.length > 0 && (
        <Card variant="focused" className="p-5 flex items-center gap-5">
          <Meter value={habits.length ? doneToday / habits.length : 0} size={60} strokeWidth={5}>
            <span className="text-xs font-extrabold text-accent number-mono">{doneToday}/{habits.length}</span>
          </Meter>
          <div>
            <p className="text-[15px] font-bold text-foreground">{doneToday === habits.length ? "All done" : "Today's rituals"}</p>
            {bestStreak > 0 && <p className="text-xs text-foreground-muted mt-1">🔥 Best streak: {bestStreak} {bestStreak === 1 ? "day" : "days"}</p>}
          </div>
        </Card>
      )}

      <Card variant="ambient" className="p-5 space-y-3">
        <SectionLabel>{habits.length ? "Today" : "No rituals yet"}</SectionLabel>
        {habits.length ? (
          <div className="space-y-2">
            {habits.map((habit) => (
              <HabitClient key={habit.id} habit={habit} log={todayLogs.find((l) => l.habit_id === habit.id)} streak={habitStreaks.get(habit.id) ?? 0} />
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-foreground-muted">Small and consistent beats big and occasional. Create your first ritual.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
