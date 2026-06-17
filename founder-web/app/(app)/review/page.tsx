import Link from "next/link";
import { getTasks, getGoals, getJournalEntries } from "@/lib/data";
import { todayKey } from "@/lib/utils";
import { Card, SectionLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ReviewPage() {
  const [tasks, goals, entries] = await Promise.all([getTasks(), getGoals(), getJournalEntries()]);
  const completedThisWeek = tasks.filter((t) => t.completed_at && t.completed_at >= getWeekAgo()).length;
  const openTasks = tasks.filter((t) => !t.completed).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold">Weekly Review</h1>
        <p className="text-text-muted dark:text-dark-text-muted mt-1">Reflect on the week and reset for the next.</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-3xl font-extrabold">{completedThisWeek}</p>
          <p className="text-xs font-bold text-text-muted dark:text-dark-text-muted mt-1">Completed this week</p>
        </Card>
        <Card className="p-4">
          <p className="text-3xl font-extrabold">{openTasks}</p>
          <p className="text-xs font-bold text-text-muted dark:text-dark-text-muted mt-1">Still open</p>
        </Card>
      </div>

      <Card className="p-5 space-y-4">
        <SectionLabel>REVIEW PROMPTS</SectionLabel>
        <ul className="space-y-3 text-[15px]">
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</span>
            What did I accomplish this week?
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</span>
            What felt hard? What felt energizing?
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</span>
            What are the top 3 priorities for next week?
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">4</span>
            What habits or systems need adjustment?
          </li>
        </ul>
      </Card>

      <Card className="p-5 space-y-4">
        <SectionLabel>GOAL PROGRESS</SectionLabel>
        {goals.length ? (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between">
                <span className="font-semibold text-sm">{goal.title}</span>
                <span className="text-sm font-extrabold text-primary">{goal.progress}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted dark:text-dark-text-muted">No goals yet.</p>
        )}
      </Card>

      <Card className="p-5 space-y-4">
        <SectionLabel>RECENT JOURNAL</SectionLabel>
        {entries.slice(0, 3).map((entry) => (
          <p key={entry.id} className="text-sm text-text-muted dark:text-dark-text-muted line-clamp-2">
            {entry.entry_date}: {entry.content}
          </p>
        ))}
        {!entries.length && <p className="text-sm text-text-muted dark:text-dark-text-muted">No journal entries this week.</p>}
      </Card>

      <div className="flex gap-3">
        <Link href="/plan" className="flex-1">
          <Button className="w-full h-12">Plan next day</Button>
        </Link>
        <Link href="/journal" className="flex-1">
          <Button variant="outline" className="w-full h-12">
            Write reflection
          </Button>
        </Link>
      </div>
    </div>
  );
}

function getWeekAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return todayKey(d);
}
