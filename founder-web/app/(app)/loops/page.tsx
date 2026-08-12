import Link from "next/link";
import { getLoopsFiltered, getPressure, getAmnestyCandidates } from "@/lib/data";
import { Amnesty } from "@/components/amnesty";
import { LOOP_FILTERS, isLoopFilter, triageOrder, type LoopFilter } from "@/lib/loops";
import { LoopRow } from "@/components/loop-row";
import { EmptyState } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function LoopsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: raw } = await searchParams;
  const filter: LoopFilter = isLoopFilter(raw) ? raw : "all";
  const active = LOOP_FILTERS.find((f) => f.key === filter)!;

  const [loops, pressure, amnestyCandidates] = await Promise.all([
    getLoopsFiltered(filter),
    getPressure(),
    // Only fetched for the shelf where letting go is the point.
    filter === "rotting" ? getAmnestyCandidates() : Promise.resolve([]),
  ]);

  // Obligations to people sort above age; self-assigned priority is the last
  // tiebreak rather than the first.
  const sorted = filter === "released" ? loops : [...loops].sort((a, b) => triageOrder(a, b));

  const countFor: Partial<Record<LoopFilter, number>> = {
    owed: pressure.owed_count,
    blocked: pressure.blocked_count,
    rotting: pressure.rotting_count,
    aging: pressure.aging_count,
    unclear: pressure.unclear_count,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground tracking-tight font-display">Loops</h1>
        <p className="text-sm text-foreground-muted mt-1">{active.blurb}</p>
      </header>

      <nav className="flex flex-wrap gap-1.5" aria-label="Filter loops">
        {LOOP_FILTERS.map((f) => {
          const n = countFor[f.key];
          const on = f.key === filter;
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/loops" : `/loops?filter=${f.key}`}
              aria-current={on ? "page" : undefined}
              className={cn(
                "h-8 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors focus-ring",
                on ? "bg-accent-600 text-white" : "bg-base-raised text-foreground-muted hover:bg-base-overlay",
              )}
            >
              {f.label}
              {/* Counts only where a number above zero means something to act on. */}
              {typeof n === "number" && n > 0 && (
                <span className={cn("number-mono", on ? "text-white/80" : "text-foreground-subtle")}>{n}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Rendered unconditionally on this shelf, not gated on candidates being
          non-empty: running an amnesty empties that list, and gating on it would
          unmount the component mid-flow and take the receipt — the only record
          of what was just let go — down with it. */}
      {filter === "rotting" && <Amnesty candidates={amnestyCandidates} />}

      {sorted.length ? (
        <div className="space-y-2">
          {sorted.map((task) => (
            <LoopRow key={task.id} task={task} showAnswers={filter !== "anti"} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>}
          title={emptyTitle(filter)}
          subtitle={emptyBody(filter)}
        />
      )}
    </div>
  );
}

// Empty is usually good news here, so it should read that way rather than as an
// absence of data.
function emptyTitle(f: LoopFilter) {
  switch (f) {
    case "owed": return "Nobody is waiting on you";
    case "blocked": return "You are not blocked on anyone";
    case "rotting": return "Nothing is rotting";
    case "aging": return "Nothing is aging";
    case "unclear": return "Every committed loop has a first move";
    case "anti": return "Nothing parked";
    case "released": return "Nothing released lately";
    default: return "No open loops";
  }
}

function emptyBody(f: LoopFilter) {
  switch (f) {
    case "owed": return "No open obligation has a person attached to it.";
    case "blocked": return "Nothing is sitting in someone else's court.";
    case "rotting": return "Nothing has sat raw for two weeks.";
    case "aging": return "Nothing has been waiting a week for an answer.";
    case "unclear": return "Everything with a date has a two-minute first step.";
    case "anti": return "Name something \"not this week\" and it stops chasing you.";
    case "released": return "Loops you let go show up here for 30 days.";
    default: return "Capture anything on your mind — it lands here.";
  }
}
