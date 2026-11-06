"use client";

import { useEffect, useMemo } from "react";
import * as A from "@/lib/actions";
import { addDays, shortDay } from "@/lib/dates";
import { useNow, useShelf, useToday } from "@/lib/hooks";
import { markShown, shownToday, skip, useSkips } from "@/lib/skips";
import { DAILY_QUESTIONS, SKIP_DAYS, suggest, type Suggestion } from "@/lib/suggest";
import { openTask } from "@/lib/ui";

type Choice = { label: string; run: () => void; primary?: boolean; danger?: boolean };

function choices(s: Suggestion, today: string): Choice[] {
  const t = s.task;
  const week = addDays(today, 7);
  const month = addDays(today, 30);
  switch (s.kind) {
    case "overdue":
      return [
        { label: "Do it today", primary: true, run: () => A.pick([t.id]) },
        { label: "Due next week", run: () => A.setDue(t.id, week, shortDay(week, today)) },
        { label: "Delete", danger: true, run: () => A.remove(t.id) },
      ];
    case "carried":
      return [
        { label: "Do it first today", primary: true, run: () => A.pickFirst(t.id) },
        // Usually the honest answer: it's too big to start. Rewrite it as the first step.
        { label: "Make it smaller", run: () => openTask(t.id, { rewrite: true }) },
        { label: "Delete", danger: true, run: () => A.remove(t.id) },
      ];
    case "duplicate":
      return [
        { label: "Merge them", primary: true, run: () => A.merge(t.id, s.other!.id) },
        { label: "They're different", run: () => skip(s.key, 3650, today) },
      ];
    case "stale":
      return [
        { label: "Keep it", primary: true, run: () => A.keep(t.id) },
        { label: "Not this month", run: () => A.snooze(t.id, month, shortDay(month, today)) },
        { label: "Delete", danger: true, run: () => A.remove(t.id) },
      ];
  }
}

/**
 * One question at the top of the list. Answer it and the next one takes its
 * place; skip it and it stays quiet for a week. At most DAILY_QUESTIONS a day —
 * the research on reminders is clear that the same nudge, repeated, stops
 * being read.
 */
export function Decide() {
  const shelf = useShelf();
  const today = useToday();
  const now = useNow();
  const skipped = useSkips();
  const list = useMemo(
    () => (shelf && today && now ? suggest(shelf, today, now, skipped) : []),
    [shelf, today, now, skipped],
  );
  const asked = today ? shownToday(today) : [];
  const s = list.find((x) => asked.includes(x.key) || asked.length < DAILY_QUESTIONS);
  useEffect(() => {
    if (s && today) markShown(s.key, today);
  }, [s, today]);
  if (!s || !today) return null;

  return (
    <section key={s.key} aria-label="A question about your list" className="mt-6 animate-rise overflow-hidden rounded-[10px] bg-card shadow-card">
      <div className="h-[2px] bg-pen/70" />
      <div className="px-5 pb-4 pt-3.5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <p className="label !text-pen">One thing to decide</p>
          <button
            type="button"
            onClick={() => skip(s.key, SKIP_DAYS, today)}
            className="-mr-2 rounded-md px-2 py-1 text-[13px] text-ink-3 hover:bg-sunk hover:text-ink"
          >
            Skip
          </button>
        </div>

        {s.kind === "duplicate" ? (
          <ul className="mt-2 space-y-1">
            {[s.task, s.other!].map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => openTask(t.id)} className="text-left text-[16px] font-medium leading-snug hover:underline">
                  {t.title}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <button
            type="button"
            onClick={() => openTask(s.task.id)}
            className="mt-2 block text-left text-[16px] font-medium leading-snug hover:underline"
          >
            {s.task.title}
          </button>
        )}
        <p className="mt-1 text-[14px] text-ink-2">{s.text}</p>

        <div className="mt-3.5 flex flex-wrap gap-2">
          {choices(s, today).map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={c.run}
              className={
                c.primary
                  ? "btn-ink"
                  : c.danger
                    ? "btn border border-hair text-red hover:bg-red/5"
                    : "btn border border-hair text-ink-2 hover:bg-sunk hover:text-ink"
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
