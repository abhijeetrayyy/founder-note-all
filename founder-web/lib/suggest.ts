import { daysSince, diffDays, type DayKey } from "./dates";
import { CARRIED_LIMIT, type Task } from "./model";
import { normalTitle, sameTask } from "./parse";
import type { Shelf } from "./rank";

/**
 * The list asks you one question at a time.
 *
 * A ranked list tells you what's next; it can't tell you what to stop carrying.
 * These are the moments where only you can decide — something is overdue, keeps
 * getting carried over, looks like a duplicate, or has sat untouched for weeks.
 * The app spots them and asks, one at a time, with the likely answers as
 * buttons. Skipping is always an answer, and a skipped question stays quiet for
 * a week so the list never turns into a nag.
 */

export type Kind = "overdue" | "carried" | "duplicate" | "stale";

export interface Suggestion {
  /** Stable for the same question about the same task(s) — used to remember a skip. */
  key: string;
  kind: Kind;
  task: Task;
  /** The other half of a likely duplicate. */
  other?: Task;
  /** The question, in plain words. */
  text: string;
}

/** How long "Skip" keeps a question quiet. */
export const SKIP_DAYS = 7;
/** Untouched this long (and nothing holding it up) and the list asks if you still want it. */
export const ASK_STALE_DAYS = 14;
/** At most this many questions a day — enough to keep the list honest, not enough to nag. */
export const DAILY_QUESTIONS = 3;

const STOP = new Set(["a", "an", "the", "to", "for", "of", "and", "on", "in", "with", "my", "at", "about", "re"]);

function words(s: string): Set<string> {
  return new Set(normalTitle(s).split(" ").filter((w) => w.length > 1 && !STOP.has(w)));
}

/**
 * Looser than the capture-time dedupe on purpose: capture merges silently, so it
 * must be sure. Here a person decides, so "probably the same" is good enough to ask.
 */
export function looksSame(a: string, b: string): boolean {
  if (sameTask(a, b)) return true;
  const wa = words(a);
  const wb = words(b);
  if (wa.size < 2 || wb.size < 2) return false;
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared++;
  if (shared < 2) return false;
  return shared / Math.min(wa.size, wb.size) >= 0.75;
}

export function suggest(shelf: Shelf, today: DayKey, now: Date, skipped: Record<string, string> = {}): Suggestion[] {
  const quiet = (key: string) => {
    const until = skipped[key];
    return !!until && diffDays(until, today) > 0;
  };
  const out: Suggestion[] = [];
  const add = (s: Suggestion) => {
    if (!quiet(s.key) && !out.some((o) => o.task.id === s.task.id)) out.push(s);
  };

  // Everything on the list, best first. Fading items already have their own
  // Keep / Delete buttons below the line, so they're not asked about twice.
  const pool = shelf.ranked.map((r) => r.task);

  for (const t of pool) {
    if (t.due && diffDays(t.due, today) < 0) {
      const late = -diffDays(t.due, today);
      add({
        key: `overdue:${t.id}:${t.due}`,
        kind: "overdue",
        task: t,
        text: late === 1 ? "This was due yesterday. Still doing it?" : `This was due ${late} days ago. Still doing it?`,
      });
    }
  }

  for (const t of pool) {
    if (t.skips >= CARRIED_LIMIT) {
      add({
        key: `carried:${t.id}:${t.skips}`,
        kind: "carried",
        task: t,
        text: `You've put this on Today ${t.skips} times without finishing it. Too big to start, or not that important?`,
      });
    }
  }

  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const a = pool[i];
      const b = pool[j];
      if (!looksSame(a.title, b.title)) continue;
      const [x, y] = [a.id, b.id].sort();
      const key = `duplicate:${x}:${y}`;
      if (quiet(key) || out.some((o) => o.task.id === a.id || o.task.id === b.id)) continue;
      out.push({ key, kind: "duplicate", task: a, other: b, text: "These two look like the same thing." });
    }
  }

  for (const t of pool) {
    if (t.starred || t.due) continue;
    const idle = daysSince(t.touchedAt, now);
    if (idle >= ASK_STALE_DAYS) {
      add({
        key: `stale:${t.id}:${t.touchedAt}`,
        kind: "stale",
        task: t,
        text: `Untouched for ${idle} days. Still want it on your list?`,
      });
    }
  }

  return out;
}
