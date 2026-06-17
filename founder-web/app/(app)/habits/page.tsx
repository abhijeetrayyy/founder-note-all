import { getHabits, getHabitLogsForDate } from "@/lib/data";
import { todayKey } from "@/lib/utils";
import { Card, SectionLabel } from "@/components/ui/card";
import { HabitRow } from "@/components/habit-row";
import { CreateHabitButton } from "@/components/create-habit-button";

export default async function HabitsPage() {
  const [habits, logs] = await Promise.all([getHabits(), getHabitLogsForDate()]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Habits</h1>
          <p className="text-text-muted dark:text-dark-text-muted mt-1">Build consistency one day at a time.</p>
        </div>
        <CreateHabitButton />
      </header>

      <Card className="p-5 space-y-3">
        <SectionLabel>TODAY — {todayKey()}</SectionLabel>
        {habits.length ? (
          habits.map((habit) => <HabitRow key={habit.id} habit={habit} log={logs.find((l) => l.habit_id === habit.id)} />)
        ) : (
          <p className="text-sm text-text-muted dark:text-dark-text-muted">No habits yet. Create one to start tracking.</p>
        )}
      </Card>
    </div>
  );
}
