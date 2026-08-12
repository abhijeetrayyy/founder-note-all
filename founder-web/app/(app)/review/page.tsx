import Link from "next/link";
import { getTasks, getGoals, getJournalEntries, getWeeklyReview, getAmnestyCandidates } from "@/lib/data";
import { todayKey } from "@/lib/utils";
import { Card, SectionLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "@/components/review-form";
import { Amnesty } from "@/components/amnesty";
import { GRACE_DAYS } from "@/lib/loops";

function getWeekStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return todayKey(d);
}

function getWeekAgo(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

export default async function ReviewPage() {
  const weekStart = getWeekStart();
  const [tasks, goals, entries, review, amnestyCandidates] = await Promise.all([
    getTasks(),
    getGoals(),
    getJournalEntries(),
    getWeeklyReview(weekStart),
    getAmnestyCandidates(),
  ]);
  const weekAgo = getWeekAgo();

  const closedThisWeek = tasks.filter((t) => t.completed_at && new Date(t.completed_at) >= weekAgo);

  // The number worth showing. Completion counts reward adding small tasks;
  // closing something that had been open a week is evidence you moved the thing
  // that was actually weighing on you.
  const closedOld = closedThisWeek.filter((t) => {
    const opened = new Date(t.created_at).getTime();
    const closed = new Date(t.completed_at!).getTime();
    return closed - opened >= GRACE_DAYS * 86_400_000;
  }).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header>
        <p className="text-sm text-foreground-muted mt-1">Reflect on the week, then reset for the next one.</p>
      </header>

      {/* Evidence, not a ratio. "Still open" used to sit here as a second tile,
          which turned this into a completion score — a number that goes up when
          you add work and so can never make anyone feel better. */}
      <div className="grid grid-cols-2 gap-3">
        <Card variant="ambient" className="p-4">
          <p className="text-3xl font-extrabold text-foreground number-mono">{closedThisWeek.length}</p>
          <p className="text-xs font-bold text-foreground-muted mt-1">Loops closed this week</p>
        </Card>
        <Card variant="ambient" className="p-4">
          <p className="text-3xl font-extrabold text-accent number-mono">{closedOld}</p>
          <p className="text-xs font-bold text-foreground-muted mt-1">
            of those had been open over a week
          </p>
        </Card>
      </div>

      <Amnesty candidates={amnestyCandidates} />

      <Card variant="ambient" className="p-5 space-y-5">
        <SectionLabel>Review prompts</SectionLabel>
        <ReviewForm weekStart={weekStart} existing={review} />
      </Card>

      <Card variant="ambient" className="p-5 space-y-4">
        <SectionLabel>Goal progress</SectionLabel>
        {goals.length ? (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground">{goal.title}</span>
                <span className="text-sm font-extrabold text-accent">{goal.progress}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground-muted">No goals yet.</p>
        )}
      </Card>

      <Card variant="ambient" className="p-5 space-y-4">
        <SectionLabel>Recent journal</SectionLabel>
        {entries.slice(0, 3).map((entry) => (
          <p key={entry.id} className="text-sm text-foreground-muted line-clamp-2">
            {entry.entry_date}: {entry.content}
          </p>
        ))}
        {!entries.length && <p className="text-sm text-foreground-muted">No journal entries this week.</p>}
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
