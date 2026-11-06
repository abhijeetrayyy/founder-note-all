import { daysSince, diffDays, shortDay, weekday, workDay, type DayKey } from "./dates";
import {
  CARRIED_LIMIT, FADE_DAYS, KEEP_DAYS, LATER_THAN_DAYS, LIST_HOLDS, NEW_GRACE_DAYS, OVERDUE_HOLD_DAYS, STALE_DAYS, TRASH_DAYS,
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
    // Long past its date, a deadline stops being one: flag it, but stop letting
    // it sit on top of everything forever. The list asks for a new date instead.
    if (d < -OVERDUE_HOLD_DAYS) parts.push({ pts: 30, why: `Overdue ${-d} days`, tone: "hot" });
    else if (d < 0) parts.push({ pts: 120 + Math.min(30, -d * 5), why: -d === 1 ? "Overdue since yesterday" : `Overdue ${-d} days`, tone: "hot" });
    else if (d === 0) parts.push({ pts: 100, why: "Due today", tone: "hot" });
    else if (d === 1) parts.push({ pts: 60, why: "Due tomorrow", tone: "warm" });
    else if (d <= 3) parts.push({ pts: 40, why: `Due ${weekday(t.due)}`, tone: "warm" });
    else if (d <= LATER_THAN_DAYS) parts.push({ pts: 20, why: `Due ${shortDay(t.due, today)}`, tone: "plain" });
  }

  if (t.starred) parts.push({ pts: 50, why: "Starred", tone: "plain" });

  // Left over once or twice: it was meant for that day, so offer it again.
  // Past that, ranking it higher only builds a loop of re-picking and not
  // doing — so it stops climbing, and the list asks what's going on instead.
  if (t.skips > 0 && t.lastPickedFor) {
    const ago = diffDays(today, t.lastPickedFor);
    if (t.skips >= CARRIED_LIMIT) {
      parts.push({ pts: 0, why: `Carried over ${t.skips} times`, tone: "warm" });
    } else if (ago >= 1 && ago <= 2) {
      parts.push({
        pts: 30,
        why: ago === 1 ? "Left over from yesterday" : `Left over from ${weekday(t.lastPickedFor)}`,
        tone: "plain",
      });
    }
  }

  if (t.wokeOn && diffDays(today, t.wokeOn) <= 2) parts.push({ pts: 25, why: "Back from snooze", tone: "plain" });

  if (t.bumps > 0) parts.push({ pts: Math.min(3, t.bumps) * 16, why: `You wrote this down ${t.bumps + 1} times`, tone: "plain" });

  if (isKept(t, now)) parts.push({ pts: 1, why: "You kept this", tone: "plain" });

  const age = daysSince(t.createdAt, now);
  if (age === 0) parts.push({ pts: 15, why: "", tone: "plain" });
  else if (age === 1) parts.push({ pts: 8, why: "", tone: "plain" });

  const idle = daysSince(t.touchedAt, now);
  // A live deadline is holding it up; sitting untouched is not neglect.
  const score = parts.reduce((s, p) => s + p.pts, 0) - (heldByDate(t, today) ? 0 : Math.min(30, idle));

  const best = parts.filter((p) => p.why).reduce<(typeof parts)[number] | null>((b, p) => (!b || p.pts > b.pts ? p : b), null);
  if (best) return { task: t, score, why: best.why, tone: best.tone };
  if (idle >= 10) return { task: t, score, why: `Untouched ${idle} days`, tone: "quiet" };
  return { task: t, score, why: null, tone: "plain" };
}

/**
 * Tasks finished per day over the last two weeks, or null when there's too
 * little history to say. Gives the list's size a meaning you can feel:
 * thirty things at three a day is ten days of work.
 */
export function pace(tasks: Task[], now: Date): number | null {
  const done = tasks.filter((t) => !t.deleted && t.status === "done" && t.doneAt && daysSince(t.doneAt, now) < 14).length;
  return done >= 7 ? done / 14 : null;
}

/** A deadline that is still meaningful: within the week ahead, or missed by less than OVERDUE_HOLD_DAYS. */
function heldByDate(t: Task, today: DayKey): boolean {
  if (!t.due) return false;
  const d = diffDays(t.due, today);
  return d <= LATER_THAN_DAYS && d >= -OVERDUE_HOLD_DAYS;
}

function isKept(t: Task, now: Date): boolean {
  return !!t.keptAt && daysSince(t.keptAt, now) < KEEP_DAYS;
}

/** Never placed below the line: just written down, or kept on purpose. */
function isProtected(t: Task, now: Date): boolean {
  return daysSince(t.createdAt, now) < NEW_GRACE_DAYS || isKept(t, now);
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
  /**
   * The list proper, ranked. Holds LIST_HOLDS — more only when that many were
   * just written down or kept, in which case `over` says so.
   */
  ranked: Rated[];
  /** Below the line or stale. Clearing unless kept. */
  fading: Fading[];
  /** Snoozed, or due far enough out that it should not be in the way yet. Soonest first. */
  later: Task[];
  /** How far past LIST_HOLDS the list is (new or kept tasks can push it over). */
  over: number;
}

/** Untouched for STALE_DAYS with no star and no live deadline holding it up. */
function isStale(t: Task, today: DayKey, now: Date): boolean {
  return daysSince(t.touchedAt, now) >= STALE_DAYS && !t.starred && !heldByDate(t, today) && !isProtected(t, now);
}

export function shelve(tasks: Task[], today: DayKey, now: Date): Shelf {
  const todayList: Task[] = [];
  const doneToday: Task[] = [];
  const later: Task[] = [];
  const pool: Rated[] = [];

  for (const t of tasks) {
    if (t.deleted) continue;
    if (t.status === "done") {
      if (t.doneAt && workDay(new Date(t.doneAt)) === today) doneToday.push(t);
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
  const fade = (r: Rated, because: Fading["because"]) => {
    const since = r.task.fadingSince ? daysSince(r.task.fadingSince, now) : 0;
    fading.push({ ...r, because, clearsIn: Math.max(0, FADE_DAYS - since) });
  };

  // Places on the list go first to what you just wrote or chose to keep; the
  // rest are filled by rank. Neglect is the truer reason when a task is both
  // stale and below the line, so stale is checked first.
  const live = pool.filter((r) => {
    if (!isStale(r.task, today, now)) return true;
    fade(r, "stale");
    return false;
  });
  let free = Math.max(0, LIST_HOLDS - live.filter((r) => isProtected(r.task, now)).length);
  for (const r of live) {
    if (isProtected(r.task, now)) ranked.push(r);
    else if (free > 0) {
      ranked.push(r);
      free--;
    } else fade(r, "below-line");
  }
  fading.sort(byRank);

  todayList.sort((a, b) => (a.pickedAt ?? a.createdAt).localeCompare(b.pickedAt ?? b.createdAt));
  doneToday.sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? ""));
  const laterDay = (t: Task) => t.snoozedUntil ?? t.due ?? "9999";
  later.sort((a, b) => laterDay(a).localeCompare(laterDay(b)));

  return { today: todayList, doneToday, ranked, fading, later, over: Math.max(0, ranked.length - LIST_HOLDS) };
}

/**
 * The housekeeping the list does by itself. Returns only the tasks that changed.
 *
 *  1. Yesterday's unfinished picks go back to the list — counted as carried, so
 *     they rank up tomorrow and admit it when they keep slipping.
 *  2. Snoozes that are up come back, marked as such.
 *  3. Whatever is below the line or stale starts its fade; whatever recovered stops.
 *  4. Anything that has faded for FADE_DAYS is cleared to Recently deleted.
 *  5. Anything deleted more than TRASH_DAYS ago is gone for good.
 *
 * Idempotent: running it twice in a row changes nothing the second time, which
 * matters because it runs on every load, focus and midnight.
 *
 * None of this counts as an edit. `updatedAt` is left alone, so housekeeping on
 * a laptop that has been asleep all week can never outrank what you actually
 * did on your phone this morning — every device works these out for itself.
 */
export function tidy(tasks: Task[], today: DayKey, now: Date): Task[] {
  const iso = now.toISOString();
  const changed = new Map<string, Task>();
  const put = (t: Task, patch: Partial<Task>) => {
    const base = changed.get(t.id) ?? t;
    changed.set(t.id, { ...base, ...patch });
  };

  for (const t of tasks) {
    if (t.deleted) continue;
    if (t.status === "let-go") {
      if (t.letGoAt && daysSince(t.letGoAt, now) >= TRASH_DAYS) put(t, { deleted: true });
      continue;
    }
    if (t.status !== "open") continue;
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
