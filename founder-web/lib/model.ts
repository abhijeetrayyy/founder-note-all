import type { DayKey } from "./dates";

/**
 * The whole data model: tasks and notes. Nothing else.
 *
 * A task is something you might do. It lives on the List until you pick it for
 * a day (Today), finish it (done), or you delete it. Delete is forgiving: the
 * task sits in Recently deleted for TRASH_DAYS, restorable, and only then is it
 * gone for good — the same promise Photos and Notes make, so nobody needs a
 * "are you sure?" dialog.
 */

/**
 * "let-go" is what the app calls Deleted. The stored value keeps its old name
 * on purpose: renaming it would make an older copy of the app, still cached on
 * a phone, read deleted tasks as open and sync them back to life.
 */
export type TaskStatus = "open" | "done" | "let-go";

export interface Task {
  id: string;
  kind: "task";
  title: string;
  details: string;
  status: TaskStatus;

  /** Your call that this matters. Capped at MAX_STARS so it keeps meaning something. */
  starred: boolean;
  /** A real deadline. Ranks it up as it gets close; far-off ones wait under "Later". */
  due: DayKey | null;
  /** "Not now" — hidden from the list until this day, then it comes back on its own. */
  snoozedUntil: DayKey | null;

  /** The day this is on Today for. Anything other than today means it is back on the list. */
  pickedFor: DayKey | null;
  /** When it was picked — keeps Today in the order you chose. */
  pickedAt: string | null;
  /** The most recent day it was picked, so a carried-over task can say so. */
  lastPickedFor: DayKey | null;
  /** Days it was picked and not finished. */
  skips: number;
  /** Times you captured it again. Writing something down twice is a signal. */
  bumps: number;
  /** The day it came back from a snooze. */
  wokeOn: DayKey | null;

  createdAt: string;
  /** Last time you did anything with it. This is the clock the list fades by. */
  touchedAt: string;
  /** When it slipped below the line. Cleared to the archive FADE_DAYS later. */
  fadingSince: string | null;
  /** When you last tapped Keep. Holds its place above the line for KEEP_DAYS. */
  keptAt: string | null;
  doneAt: string | null;
  /** When it was deleted. */
  letGoAt: string | null;
  /** "you" = you deleted it; "faded" = the list cleared it after it sat below the line. */
  letGoReason: "you" | "faded" | null;

  /** Sync bookkeeping: last write wins on this, and deleted rows are tombstones. */
  updatedAt: string;
  deleted: boolean;
}

export interface Note {
  id: string;
  kind: "note";
  /** First line is the title. No separate field — you just write. */
  body: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

export type Rec = Task | Note;

// ---------------------------------------------------------------------------
// The rules. Every number the app enforces is here, and nowhere else.
// ---------------------------------------------------------------------------

/** How many things the list holds. Past this, the lowest-ranked start to fade. */
export const LIST_HOLDS = 30;
/** Untouched this long and nothing (a star, a date) is holding it up → it fades. */
export const STALE_DAYS = 21;
/** How long something fades before it is cleared to Recently deleted. */
export const FADE_DAYS = 7;
/** How long a deleted task can still be restored before it is gone for good. */
export const TRASH_DAYS = 30;
/** Keep means it: a kept task holds a place above the line for this long. */
export const KEEP_DAYS = 7;
/**
 * A task you just wrote down never starts below the line. A big dump can push
 * the list past LIST_HOLDS for a couple of days; the oldest give way, not the
 * thing you thought of a minute ago.
 */
export const NEW_GRACE_DAYS = 2;
/**
 * A deadline missed by more than this has stopped being a deadline. It no
 * longer outranks everything; the list asks for a new date instead.
 */
export const OVERDUE_HOLD_DAYS = 7;
/** If everything is starred, nothing is. */
export const MAX_STARS = 5;
/** Carried over this many times, a task stops ranking up and the list asks about it. */
export const CARRIED_LIMIT = 3;
/** How many the app suggests at a time. Pick a few, finish, pick more. */
export const PICK_BATCH = 3;
/** More open picks than this and Today stops being a plan. */
export const BUSY_TODAY = 5;
/** Deadlines further out than this sleep under "Later" instead of crowding the list. */
export const LATER_THAN_DAYS = 7;

export function newId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  // randomUUID only exists in secure contexts; a phone hitting a LAN IP over
  // plain http is not one. Build a v4 by hand from getRandomValues.
  const b = new Uint8Array(16);
  if (c && typeof c.getRandomValues === "function") c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function makeTask(title: string, now: Date, extra: Partial<Task> = {}): Task {
  const iso = now.toISOString();
  return {
    id: newId(),
    kind: "task",
    title,
    details: "",
    status: "open",
    starred: false,
    due: null,
    snoozedUntil: null,
    pickedFor: null,
    pickedAt: null,
    lastPickedFor: null,
    skips: 0,
    bumps: 0,
    wokeOn: null,
    createdAt: iso,
    touchedAt: iso,
    fadingSince: null,
    keptAt: null,
    doneAt: null,
    letGoAt: null,
    letGoReason: null,
    updatedAt: iso,
    deleted: false,
    ...extra,
  };
}

export function makeNote(body: string, now: Date): Note {
  const iso = now.toISOString();
  return { id: newId(), kind: "note", body, pinned: false, createdAt: iso, updatedAt: iso, deleted: false };
}

/**
 * Fill in anything a stored record is missing.
 *
 * Records come from localStorage, from an imported backup, or from another
 * device that may be running an older build. None of those are guaranteed to
 * have every field, and a missing `skips` turning into NaN would quietly break
 * ranking for that row forever.
 */
export function normalize(raw: unknown): Rec | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string") return null;
  const str = (v: unknown, d: string) => (typeof v === "string" ? v : d);
  const strOrNull = (v: unknown) => (typeof v === "string" && v ? v : null);
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const now = new Date().toISOString();

  if (r.kind === "note") {
    return {
      id: r.id,
      kind: "note",
      body: str(r.body, ""),
      pinned: r.pinned === true,
      createdAt: str(r.createdAt, now),
      updatedAt: str(r.updatedAt, now),
      deleted: r.deleted === true,
    };
  }
  if (r.kind !== "task") return null;
  const status: TaskStatus = r.status === "done" || r.status === "let-go" ? r.status : "open";
  const createdAt = str(r.createdAt, now);
  return {
    id: r.id,
    kind: "task",
    title: str(r.title, "").trim() || "Untitled",
    details: str(r.details, ""),
    status,
    starred: r.starred === true,
    due: strOrNull(r.due),
    snoozedUntil: strOrNull(r.snoozedUntil),
    pickedFor: strOrNull(r.pickedFor),
    pickedAt: strOrNull(r.pickedAt),
    lastPickedFor: strOrNull(r.lastPickedFor),
    skips: num(r.skips),
    bumps: num(r.bumps),
    wokeOn: strOrNull(r.wokeOn),
    createdAt,
    touchedAt: str(r.touchedAt, createdAt),
    fadingSince: strOrNull(r.fadingSince),
    keptAt: strOrNull(r.keptAt),
    doneAt: strOrNull(r.doneAt),
    letGoAt: strOrNull(r.letGoAt),
    letGoReason: r.letGoReason === "you" || r.letGoReason === "faded" ? r.letGoReason : null,
    updatedAt: str(r.updatedAt, createdAt),
    deleted: r.deleted === true,
  };
}

/** A note's title is its first non-empty line. */
export function noteTitle(n: Note): string {
  const line = n.body.split("\n").find((l) => l.trim());
  return line ? line.trim().replace(/^#+\s*/, "") : "Empty note";
}

/** The line after the title, for the list preview. */
export function notePreview(n: Note): string {
  const lines = n.body.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.slice(1).join(" · ").slice(0, 140);
}
