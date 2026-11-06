import { dayKey, daysSince, diffDays, shortDay, weekday, type DayKey } from "./dates";
import {
  FADE_DAYS, LATER_THAN_DAYS, LIST_HOLDS, STALE_DAYS,
  type Task,
} from "./model";

/**
 * How the list stays small enough to mean something.
 *
 * Every open task gets a score from facts it already carries — a deadline, a
 * star, being carried over, being written down twice — minus a little for every
 * day nobody touched it. The list is sorted by that score and holds LIST_HOLDS.
 * Whatever falls below the line, or sits untouched for STALE_DAYS with nothing
 * holding it up, starts to fade; FADE_DAYS later it is cleared to the archive.
 *
 * So capture is always free, but keeping is not: the list can only stay long if
 * you keep choosing to keep things on it.
 */

export type Tone = "hot" | "warm" | "plain" | "quiet";

export interface Rated {
  task: Task;
  score: number;
  /** The one fact that put it where it is, in words. Null when nothing stands out. */
  why: string | null;
  tone: Tone;
}

export function rate(t: Task, today: DayKey, now: Date): Rated {
  // `why` is empty for facts worth points but not worth saying ("new" says
  // nothing when everything you just dumped is new).
  const parts: { pts: number; why: string; tone: Tone }[] = [];

  if (t.due) {
    const d = diffDays(t.due, today);
    if (d < 0) parts.push({ pts: 120 + Math.min(30, -d * 5), why: -d === 1 ? "Overdue since yesterday" : `Overdue ${-d} days`, tone: "hot" });
    else if (d === 0) parts.push({ pts: 100, why: "Due today", tone: "hot" });
    else if (d === 1) parts.push({ pts: 60, why: "Due tomorrow", tone: "warm" });
    else if (d <= 3) parts.push({ pts: 40, why: `Due ${weekday(t.due)}`, tone: "warm" });
    else if (d <= LATER_THAN_DAYS) parts.push({ pts: 20, why: `Due ${shortDay(t.due, today)}`, tone: "plain" });
  }

  if (t.starred) parts.push({ pts: 50, why: "Starred", tone: "plain" });

  if (t.skips > 0 && t.lastPickedFor) {
    const ago = diffDays(today, t.lastPickedFor);
    if (ago >= 1 && ago <= 2) {
      parts.push({
        pts: 30,
        why: t.skips >= 3
          ? `Carried over ${t.skips} times — do it or let it go`
          : ago === 1 ? "Left over from yesterday" : `Left over from ${weekday(t.lastPickedFor)}`,
        tone: t.skips >= 3 ? "warm" : "plain",
      });
    }
  }

  if (t.wokeOn && diffDays(today, t.wokeOn) <= 2) parts.push({ pts: 25, why: "Back from snooze", tone: "plain" });

  if (t.bumps > 0) parts.push({ pts: Math.min(3, t.bumps) * 16, why: `You wrote this down ${t.bumps + 1} times`, tone: "plain" });

  const age = daysSince(t.createdAt, now);
  if (age === 0) parts.push({ pts: 15, why: "", tone: "plain" });
  else if (age === 1) parts.push({ pts: 8, why: "", tone: "plain" });

  const idle = daysSince(t.touchedAt, now);
  // A deadline inside the week is holding it up; sitting untouched is not neglect.
  const held = t.due !== null && diffDays(t.due, today) <= LATER_THAN_DAYS;
  const score = parts.reduce((s, p) => s + p.pts, 0) - (held ? 0 : Math.min(30, idle));

  const best = parts.filter((p) => p.why).reduce<(typeof parts)[number] | null>((b, p) => (!b || p.pts > b.pts ? p : b), null);
  if (best) return { task: t, score, why: best.why, tone: best.tone };
  if (idle >= 7) return { task: t, score, why: `Untouched ${idle} days`, tone: "quiet" };
  return { task: t, score, why: null, tone: "plain" };
}

function byRank(a: Rated, b: Rated): number {
  if (b.score !== a.score) return b.score - a.score;
  return b.task.createdAt.localeCompare(a.task.createdAt);
}

/** Open, alive, and not on today or set aside for later. */
function onList(t: Task, today: DayKey): boolean {
  if (t.deleted || t.status !== "open") return false;
  if (t.pickedFor === today) return false;
  if (t.snoozedUntil && diffDays(t.snoozedUntil, today) > 0) return false;
  if (t.due && diffDays(t.due, today) > LATER_THAN_DAYS) return false;
  return true;
}

export interface Fading extends Rated {
  /** Whole days left before it is cleared. 0 means it goes at the next tidy. */
  clearsIn: number;
  /** Why it is fading — below the line, or just left alone too long. */
  because: "below-line" | "stale";
}

export interface Shelf {
  /** Picked for today and still open, in the order you picked them. */
  today: Task[];
  /** Finished today, most recent first. */
  doneToday: Task[];
  /** The list proper: ranked, at most LIST_HOLDS. */
  ranked: Rated[];
  /** Below the line or stale. Clearing unless kept. */
  fading: Fading[];
  /** Snoozed, or due far enough out that it should not be in the way yet. Soonest first. */
  later: Task[];
}

function fadeVerdict(r: Rated, index: number, idle: number): Fading["because"] | null {
  const t = r.task;
  // Neglect is the truer reason when both apply, so it is the one we say.
  if (idle >= STALE_DAYS && !t.starred && !t.due) return "stale";
  if (index >= LIST_HOLDS) return "below-line";
  return null;
}

export function shelve(tasks: Task[], today: DayKey, now: Date): Shelf {
  const todayList: Task[] = [];
  const doneToday: Task[] = [];
  const later: Task[] = [];
  const pool: Rated[] = [];

  for (const t of tasks) {
    if (t.deleted) continue;
    if (t.status === "done") {
      if (t.doneAt && dayKey(new Date(t.doneAt)) === today) doneToday.push(t);
      continue;
    }
    if (t.status !== "open") continue;
    if (t.pickedFor === today) todayList.push(t);
    else if (onList(t, today)) pool.push(rate(t, today, now));
    else later.push(t);
  }

  pool.sort(byRank);
  const ranked: Rated[] = [];
  const fading: Fading[] = [];
  pool.forEach((r, i) => {
    const because = fadeVerdict(r, i, daysSince(r.task.touchedAt, now));
    if (!because) {
      ranked.push(r);
      return;
    }
    const since = r.task.fadingSince ? daysSince(r.task.fadingSince, now) : 0;
    fading.push({ ...r, because, clearsIn: Math.max(0, FADE_DAYS - since) });
  });

  todayList.sort((a, b) => (a.pickedAt ?? a.createdAt).localeCompare(b.pickedAt ?? b.createdAt));
  doneToday.sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? ""));
  const laterDay = (t: Task) => t.snoozedUntil ?? t.due ?? "9999";
  later.sort((a, b) => laterDay(a).localeCompare(laterDay(b)));

  return { today: todayList, doneToday, ranked, fading, later };
}

/**
 * The housekeeping the list does by itself. Returns only the tasks that changed.
 *
 *  1. Yesterday's unfinished picks go back to the list — counted as carried, so
 *     they rank up tomorrow and admit it when they keep slipping.
 *  2. Snoozes that are up come back, marked as such.
 *  3. Whatever is below the line or stale starts its fade; whatever recovered stops.
 *  4. Anything that has faded for FADE_DAYS is cleared to the archive.
 *
 * Idempotent: running it twice in a row changes nothing the second time, which
 * matters because it runs on every load, focus and midnight.
 */
export function tidy(tasks: Task[], today: DayKey, now: Date): Task[] {
  const iso = now.toISOString();
  const changed = new Map<string, Task>();
  const put = (t: Task, patch: Partial<Task>) => {
    const base = changed.get(t.id) ?? t;
    changed.set(t.id, { ...base, ...patch, updatedAt: iso });
  };

  for (const t of tasks) {
    if (t.deleted || t.status !== "open") continue;
    if (t.pickedFor && diffDays(t.pickedFor, today) < 0) {
      put(t, { pickedFor: null, pickedAt: null, skips: t.skips + 1, lastPickedFor: t.pickedFor });
    }
    if (t.snoozedUntil && diffDays(t.snoozedUntil, today) <= 0) {
      put(t, { snoozedUntil: null, wokeOn: today, touchedAt: iso, fadingSince: null });
    }
  }

  const current = () => tasks.map((t) => changed.get(t.id) ?? t);

  // Clear what has run out of time first, so the line is drawn on what is left.
  for (const f of shelve(current(), today, now).fading) {
    if (f.task.fadingSince && f.clearsIn <= 0) {
      put(f.task, { status: "let-go", letGoAt: iso, letGoReason: "faded", fadingSince: null });
    }
  }

  const after = current();
  const fading = shelve(after, today, now).fading;
  const fadingIds = new Set(fading.map((f) => f.task.id));
  for (const f of fading) {
    if (!f.task.fadingSince) put(f.task, { fadingSince: iso });
  }
  for (const t of after) {
    if (t.fadingSince && !fadingIds.has(t.id)) put(t, { fadingSince: null });
  }

  return [...changed.values()];
}
