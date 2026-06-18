import Link from "next/link";
import { getProfile, getTasksDueToday, getHabits, getHabitLogsForDate, getEnergyLog, getNotes, getGoals, getTodaySummary, getDailyPlan } from "@/lib/data";
import { todayKey, greeting } from "@/lib/utils";
import { Card, SectionLabel } from "@/components/ui/card";
import { TaskItem } from "@/components/task-item";
import { HabitRow } from "@/components/habit-row";
import { EnergyPicker, EnergyBadge } from "@/components/energy-picker";
import { NoteCard } from "@/components/note-card";
import { GoalCard } from "@/components/goal-card";

export default async function TodayPage() {
  const [profile, tasks, habits, habitLogs, energy, notes, goals, summary, plan] = await Promise.all([
    getProfile(),
    getTasksDueToday(),
    getHabits(),
    getHabitLogsForDate(),
    getEnergyLog(),
    getNotes(),
    getGoals(),
    getTodaySummary(),
    getDailyPlan(),
  ]);

  const greetingText = greeting(profile?.display_name || "Founder");
  const mitIds = plan?.mit_task_ids ?? [];
  const mits = tasks.filter((t) => mitIds.includes(t.id));
  const rest = tasks.filter((t) => !mitIds.includes(t.id));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{greetingText}</h1>
          <p className="text-text-muted dark:text-dark-text-muted mt-1">Today is {todayKey()}. Let&apos;s execute.</p>
        </div>
        <EnergyBadge value={energy?.level ?? profile?.energy_default} />
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Inbox" value={summary.inbox_count} href="/inbox" />
        <SummaryCard label="Due today" value={summary.due_today_count} href="/tasks" />
        <SummaryCard label="Done today" value={summary.completed_today_count} href="/tasks" />
        <SummaryCard label="Habits" value={summary.habits_done_today} href="/habits" />
      </div>

      {plan?.intention_text ? (
        <Card className="p-5 border-primary/30 bg-primary/5">
          <SectionLabel className="mb-2">TODAY&apos;S INTENTION</SectionLabel>
          <p className="text-lg font-bold leading-snug">{plan.intention_text}</p>
          {plan.blocker_notes ? (
            <p className="mt-2 text-sm text-text-muted dark:text-dark-text-muted">Blockers: {plan.blocker_notes}</p>
          ) : null}
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <SectionLabel>MOST IMPORTANT TASKS</SectionLabel>
              <Link href="/plan" className="text-xs font-bold text-primary hover:underline">
                {mits.length ? "Edit plan" : "Plan day"}
              </Link>
            </div>
            {mits.length ? (
              <div className="space-y-3">
                {mits.map((task, i) => (
                  <div key={task.id} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0 mt-1">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <TaskItem task={task} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted dark:text-dark-text-muted">No MITs yet. Set your top priorities in Plan.</p>
            )}
          </Card>

          <Card className="p-5 space-y-4">
            <SectionLabel>DUE TODAY</SectionLabel>
            {rest.length ? (
              <div className="space-y-3">
                {rest.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted dark:text-dark-text-muted">No more tasks due today. Capture something new?</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <SectionLabel>ENERGY CHECK-IN</SectionLabel>
            <EnergyPicker value={energy?.level ?? profile?.energy_default} />
            <p className="text-xs text-text-muted dark:text-dark-text-muted">Match your work to your current energy level.</p>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <SectionLabel>HABITS</SectionLabel>
              <Link href="/habits" className="text-xs font-bold text-primary hover:underline">
                All habits
              </Link>
            </div>
            <div className="space-y-2">
              {habits.slice(0, 4).map((habit) => (
                <HabitRow key={habit.id} habit={habit} log={habitLogs.find((l) => l.habit_id === habit.id)} />
              ))}
              {!habits.length && <p className="text-sm text-text-muted dark:text-dark-text-muted">No habits yet.</p>}
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <SectionLabel>GOALS</SectionLabel>
              <Link href="/goals" className="text-xs font-bold text-primary hover:underline">
                All goals
              </Link>
            </div>
            {goals.slice(0, 2).map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
            {!goals.length && <p className="text-sm text-text-muted dark:text-dark-text-muted">No goals yet.</p>}
          </Card>
        </div>
      </div>

      {notes.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>RECENT NOTES</SectionLabel>
            <Link href="/notes" className="text-xs font-bold text-primary hover:underline">
              All notes
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.slice(0, 3).map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="card p-4 card-hover">
      <p className="text-3xl font-extrabold">{value}</p>
      <p className="text-xs font-bold text-text-muted dark:text-dark-text-muted mt-1">{label}</p>
    </Link>
  );
}
