/**
 * Calendar days, in the person's own timezone.
 *
 * Everything in the app that is "per day" — what you picked, what is due, how
 * long something has sat untouched — is keyed by a local YYYY-MM-DD string.
 * Comparing timestamps instead would make 11pm and 1am "the same day" or not
 * depending on where the server happens to be.
 */

export type DayKey = string;

export function dayKey(d: Date = new Date()): DayKey {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * The day starts at 4am, not midnight. Someone still working at 12:30am is
 * finishing their day, not starting the next one — a midnight cut-off would
 * empty Today under them and count what they picked as "carried over".
 */
export const DAY_STARTS_AT_HOUR = 4;

/** The working day a moment belongs to. Use this, not dayKey, for "today". */
export function workDay(d: Date = new Date()): DayKey {
  return dayKey(new Date(d.getTime() - DAY_STARTS_AT_HOUR * 3_600_000));
}

export function fromKey(k: DayKey): Date {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(k: DayKey, n: number): DayKey {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

/** a − b, in whole calendar days. Rounded so DST's 23/25-hour days still count as one. */
export function diffDays(a: DayKey, b: DayKey): number {
  return Math.round((fromKey(a).getTime() - fromKey(b).getTime()) / 86_400_000);
}

/** Working days between an ISO timestamp and now. Never negative. */
export function daysSince(iso: string, now: Date): number {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return 0;
  return Math.max(0, diffDays(workDay(now), workDay(then)));
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function weekday(k: DayKey): string {
  return WEEKDAYS[fromKey(k).getDay()];
}

export function longDate(k: DayKey): string {
  const d = fromKey(k);
  return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`;
}

/** "today", "tomorrow", "Fri", "12 Nov", "12 Nov 2027" — the shortest thing that is unambiguous. */
export function shortDay(k: DayKey, today: DayKey): string {
  const delta = diffDays(k, today);
  if (delta === 0) return "today";
  if (delta === 1) return "tomorrow";
  if (delta === -1) return "yesterday";
  if (delta > 1 && delta < 7) return WEEKDAYS[fromKey(k).getDay()].slice(0, 3);
  const d = fromKey(k);
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === fromKey(today).getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

/** "just now", "5 min ago", "3 h ago", "2 days ago" — for sync and note timestamps. */
export function ago(iso: string, now: Date): string {
  const ms = now.getTime() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 45_000) return "just now";
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = daysSince(iso, now);
  if (d <= 1) return "yesterday";
  if (d < 7) return `${d} days ago`;
  return shortDay(dayKey(new Date(iso)), dayKey(now));
}
