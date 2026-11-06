import { daysSince, workDay } from "./dates";
import { MAX_STARS, TRASH_DAYS, makeNote, makeTask, normalize, type Note, type Rec, type Task } from "./model";
import { parseCapture, sameTask, splitDump, type Literal } from "./parse";
import { tidy } from "./rank";

/**
 * The store. Lives on the device, works offline, survives without a server.
 *
 * The previous version kept everything in a hosted database and rendered on the
 * server, so the day that database went away the whole app went with it. Here
 * the device is the source of truth and sync (lib/sync.ts) is a copy you can
 * turn on — capture never waits on a network.
 *
 * Every mutation returns the records as they were before it, so any action can
 * be undone from a toast by writing those back.
 */

const KEY = "fos.v1";
const DIRTY_KEY = "fos.dirty";

export interface DB {
  tasks: Record<string, Task>;
  notes: Record<string, Note>;
}

export interface State {
  loaded: boolean;
  db: DB;
  /** Set when the browser refused to save (private mode, full storage). Shown, never swallowed. */
  saveFailed: boolean;
}

const EMPTY: State = { loaded: false, db: { tasks: {}, notes: {} }, saveFailed: false };

let state: State = EMPTY;
let dirty = new Set<string>();
const listeners = new Set<() => void>();
let changeHook: (() => void) | null = null;

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
export const getState = () => state;
export const getServerState = () => EMPTY;

function emit() {
  for (const l of listeners) l();
}

/** Called after every local change — sync uses it to schedule a push. */
export function onLocalChange(fn: (() => void) | null) {
  changeHook = fn;
}

function readStorage(): DB {
  const db: DB = { tasks: {}, notes: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return db;
    const parsed = JSON.parse(raw) as { tasks?: unknown[]; notes?: unknown[] };
    for (const r of [...(parsed.tasks ?? []), ...(parsed.notes ?? [])]) {
      const rec = normalize(r);
      if (!rec) continue;
      if (rec.kind === "task") db.tasks[rec.id] = rec;
      else db.notes[rec.id] = rec;
    }
  } catch {
    // A corrupt blob must not brick the app. Start empty; the bad copy is left
    // in place under a side key so it can still be recovered by hand.
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) localStorage.setItem(`${KEY}.corrupt.${Date.now()}`, raw);
    } catch {}
  }
  return db;
}

function readDirty(): Set<string> {
  try {
    const raw = localStorage.getItem(DIRTY_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function load() {
  if (state.loaded || typeof window === "undefined") return;
  state = { loaded: true, db: readStorage(), saveFailed: false };
  dirty = readDirty();
  // Another tab wrote — take its version so two open tabs never overwrite each other.
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      state = { ...state, db: readStorage() };
      emit();
    } else if (e.key === DIRTY_KEY) {
      dirty = readDirty();
    }
  });
  emit();
}

function persist() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ v: 1, tasks: Object.values(state.db.tasks), notes: Object.values(state.db.notes) }),
    );
    localStorage.setItem(DIRTY_KEY, JSON.stringify([...dirty]));
    if (state.saveFailed) state = { ...state, saveFailed: false };
  } catch {
    state = { ...state, saveFailed: true };
  }
}

/** Write records. `local` marks them for sync; remote merges do not. */
function write(recs: Rec[], local = true) {
  if (recs.length === 0) return;
  const tasks = { ...state.db.tasks };
  const notes = { ...state.db.notes };
  for (const r of recs) {
    if (r.kind === "task") tasks[r.id] = r;
    else notes[r.id] = r;
    if (local) dirty.add(r.id);
  }
  state = { ...state, db: { tasks, notes } };
  persist();
  emit();
  if (local) changeHook?.();
}

const iso = (now: Date) => now.toISOString();

function patchTask(id: string, patch: Partial<Task>, now: Date, touch = true): Rec[] {
  const t = state.db.tasks[id];
  if (!t) return [];
  write([{ ...t, ...patch, ...(touch ? { touchedAt: iso(now) } : {}), updatedAt: iso(now) }]);
  return [t];
}

/** Put records back exactly as they were (with a fresh timestamp so the restore syncs). */
export function restore(prev: Rec[], now = new Date()) {
  write(prev.map((r) => ({ ...r, updatedAt: iso(now) })));
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export function starCount(): number {
  return Object.values(state.db.tasks).filter((t) => t.starred && t.status === "open" && !t.deleted).length;
}

export interface CaptureResult {
  added: Task[];
  /** Already on the list — moved up instead of duplicated. */
  bumped: Task[];
  /** Asked for a star but MAX_STARS were already taken. */
  starRefused: boolean;
  undo: Rec[];
  /** Ids created, so undo can remove them. */
  createdIds: string[];
}

/**
 * Capture one line or a whole dump. Never blocks, never asks.
 *
 * A line that matches something still open bumps that task instead of adding a
 * twin: writing it down again is the strongest signal there is that it matters.
 *
 * The same goes for something that faded off the list on its own — an idea that
 * comes back was worth keeping, so it returns with its history. What you
 * deleted yourself, or finished, is never revived: "call the bank" next month
 * is a new task.
 */
export function capture(text: string, now = new Date(), literal: Literal = {}): CaptureResult {
  const today = workDay(now);
  const lines = text.includes("\n") ? splitDump(text) : [text.trim()].filter(Boolean);
  const res: CaptureResult = { added: [], bumped: [], starRefused: false, undo: [], createdIds: [] };
  const working = { ...state.db.tasks };
  let stars = starCount();

  for (const line of lines) {
    const p = parseCapture(line, today, literal);
    const wantStar = p.starred && stars < MAX_STARS;
    if (p.starred && !wantStar) res.starRefused = true;

    const twin =
      Object.values(working).find((t) => !t.deleted && t.status === "open" && sameTask(t.title, p.title)) ??
      Object.values(working).find(
        (t) =>
          !t.deleted &&
          t.status === "let-go" &&
          t.letGoReason === "faded" &&
          !!t.letGoAt &&
          daysSince(t.letGoAt, now) < TRASH_DAYS &&
          sameTask(t.title, p.title),
      );

    if (twin) {
      if (!res.createdIds.includes(twin.id) && !res.undo.some((u) => u.id === twin.id)) res.undo.push(state.db.tasks[twin.id]);
      const next: Task = {
        ...twin,
        status: "open",
        letGoAt: null,
        letGoReason: null,
        bumps: twin.bumps + 1,
        touchedAt: iso(now),
        updatedAt: iso(now),
        fadingSince: null,
        snoozedUntil: null,
        due: p.due ?? twin.due,
        starred: twin.starred || wantStar,
        ...(p.today ? { pickedFor: today, pickedAt: twin.pickedFor === today ? twin.pickedAt : iso(now), lastPickedFor: today } : {}),
      };
      if (wantStar && !twin.starred) stars++;
      working[twin.id] = next;
      if (!res.bumped.some((b) => b.id === next.id) && !res.createdIds.includes(next.id)) res.bumped.push(next);
      continue;
    }

    const t = makeTask(p.title, now, {
      due: p.due,
      starred: wantStar,
      ...(p.today ? { pickedFor: today, pickedAt: iso(now), lastPickedFor: today } : {}),
    });
    if (wantStar) stars++;
    working[t.id] = t;
    res.added.push(t);
    res.createdIds.push(t.id);
  }

  // Report the final state of anything touched more than once in the dump.
  res.added = res.added.map((t) => working[t.id]);
  res.bumped = res.bumped.map((t) => working[t.id]);
  write([...res.added, ...res.bumped]);
  return res;
}

/** Undo a capture: remove what it created, restore what it bumped. */
export function undoCapture(res: CaptureResult, now = new Date()) {
  const gone = res.createdIds
    .map((id) => state.db.tasks[id])
    .filter(Boolean)
    .map((t) => ({ ...t, deleted: true, updatedAt: iso(now) }));
  write(gone);
  restore(res.undo, now);
}

export function pick(ids: string[], now = new Date()): Rec[] {
  const today = workDay(now);
  const prev: Rec[] = [];
  const next: Task[] = [];
  ids.forEach((id, i) => {
    const t = state.db.tasks[id];
    if (!t) return;
    prev.push(t);
    // Stagger by a millisecond so a batch keeps the order it was suggested in.
    const at = new Date(now.getTime() + i).toISOString();
    next.push({
      ...t,
      status: "open",
      pickedFor: today,
      pickedAt: at,
      lastPickedFor: today,
      snoozedUntil: null,
      fadingSince: null,
      touchedAt: iso(now),
      updatedAt: iso(now),
    });
  });
  write(next);
  return prev;
}

/** Put it on Today, at the top — for the thing that keeps slipping. */
export function pickFirst(id: string, now = new Date()): Rec[] {
  const today = workDay(now);
  const t = state.db.tasks[id];
  if (!t) return [];
  const first = Object.values(state.db.tasks)
    .filter((x) => x.pickedFor === today && x.status === "open" && x.pickedAt)
    .map((x) => x.pickedAt!)
    .sort()[0];
  const at = first ? new Date(new Date(first).getTime() - 1000).toISOString() : iso(now);
  write([{ ...t, status: "open", pickedFor: today, pickedAt: at, lastPickedFor: today, snoozedUntil: null, fadingSince: null, touchedAt: iso(now), updatedAt: iso(now) }]);
  return [t];
}

export const unpick = (id: string, now = new Date()) => patchTask(id, { pickedFor: null, pickedAt: null }, now);

export const complete = (id: string, now = new Date()) =>
  patchTask(id, { status: "done", doneAt: iso(now), fadingSince: null }, now);

/** Back to open. Off Today unless it was picked today — an old pick must not count as carried over. */
export function reopen(id: string, now = new Date()): Rec[] {
  const t = state.db.tasks[id];
  if (!t) return [];
  const stillToday = t.pickedFor === workDay(now);
  return patchTask(
    id,
    {
      status: "open",
      doneAt: null,
      letGoAt: null,
      letGoReason: null,
      fadingSince: null,
      pickedFor: stillToday ? t.pickedFor : null,
      pickedAt: stillToday ? t.pickedAt : null,
    },
    now,
  );
}

/** Delete: into Recently deleted, restorable for TRASH_DAYS. */
export const remove = (id: string, now = new Date()) =>
  patchTask(id, { status: "let-go", letGoAt: iso(now), letGoReason: "you", fadingSince: null, pickedFor: null, pickedAt: null }, now, false);

/**
 * Fold a duplicate into the task that stays. Nothing written on either is lost:
 * details are joined, the earlier deadline and any star survive, and the merged
 * one counts as one more time you wrote it down.
 */
export function mergeTasks(keepId: string, dropId: string, now = new Date()): Rec[] {
  const keep = state.db.tasks[keepId];
  const drop = state.db.tasks[dropId];
  if (!keep || !drop || keepId === dropId) return [];
  const details = [keep.details.trim(), drop.details.trim(), drop.title !== keep.title ? `Also written as: ${drop.title}` : ""]
    .filter(Boolean)
    .join("\n\n");
  const due = keep.due && drop.due ? (keep.due < drop.due ? keep.due : drop.due) : keep.due ?? drop.due;
  write([
    {
      ...keep,
      details,
      due,
      starred: keep.starred || (drop.starred && starCount() < MAX_STARS),
      bumps: keep.bumps + drop.bumps + 1,
      skips: Math.max(keep.skips, drop.skips),
      touchedAt: iso(now),
      fadingSince: null,
      updatedAt: iso(now),
    },
    { ...drop, deleted: true, updatedAt: iso(now) },
  ]);
  return [keep, drop];
}

/** Delete several at once — "clear everything below the line" — as one undoable step. */
export function removeMany(ids: string[], now = new Date()): Rec[] {
  const prev = ids.map((id) => state.db.tasks[id]).filter(Boolean);
  write(
    prev.map((t) => ({
      ...t,
      status: "let-go" as const,
      letGoAt: iso(now),
      letGoReason: "you" as const,
      fadingSince: null,
      pickedFor: null,
      pickedAt: null,
      updatedAt: iso(now),
    })),
  );
  return prev;
}

/** Rescue something that is fading: it holds a place above the line for KEEP_DAYS. */
export const keep = (id: string, now = new Date()) => patchTask(id, { fadingSince: null, keptAt: iso(now) }, now);

export const snooze = (id: string, until: string, now = new Date()) =>
  patchTask(id, { snoozedUntil: until, pickedFor: null, pickedAt: null, fadingSince: null, wokeOn: null }, now);

export const unsnooze = (id: string, now = new Date()) =>
  patchTask(id, { snoozedUntil: null, wokeOn: workDay(now), fadingSince: null }, now);

export const setDue = (id: string, due: string | null, now = new Date()) => patchTask(id, { due }, now);

export function editTask(id: string, patch: { title?: string; details?: string }, now = new Date()): Rec[] {
  const t = state.db.tasks[id];
  if (!t) return [];
  const title = patch.title === undefined ? t.title : patch.title.trim() || t.title;
  const details = patch.details === undefined ? t.details : patch.details;
  if (title === t.title && details === t.details) return [];
  // Rewriting the title is how a stuck task gets made smaller — that's a new
  // commitment, so the carried-over count starts again.
  return patchTask(id, { title, details, ...(title !== t.title ? { skips: 0 } : {}) }, now);
}

/** Returns false (and changes nothing) when starring would exceed MAX_STARS. */
export function toggleStar(id: string, now = new Date()): { ok: boolean; prev: Rec[] } {
  const t = state.db.tasks[id];
  if (!t) return { ok: false, prev: [] };
  if (!t.starred && starCount() >= MAX_STARS) return { ok: false, prev: [] };
  return { ok: true, prev: patchTask(id, { starred: !t.starred }, now) };
}

/** Gone for good (still a tombstone, so other devices learn it is gone). */
export const deleteTask = (id: string, now = new Date()) => patchTask(id, { deleted: true }, now, false);

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export function createNote(body = "", now = new Date()): Note {
  const n = makeNote(body, now);
  write([n]);
  return n;
}

export function editNote(id: string, body: string, now = new Date()) {
  const n = state.db.notes[id];
  if (!n || n.body === body) return;
  write([{ ...n, body, updatedAt: iso(now) }]);
}

export function togglePin(id: string, now = new Date()): Rec[] {
  const n = state.db.notes[id];
  if (!n) return [];
  write([{ ...n, pinned: !n.pinned, updatedAt: iso(now) }]);
  return [n];
}

export function deleteNote(id: string, now = new Date()): Rec[] {
  const n = state.db.notes[id];
  if (!n) return [];
  write([{ ...n, deleted: true, updatedAt: iso(now) }]);
  return [n];
}

const TODO_LINE = /^(\s*(?:[-*]\s+)?)\[ \]\s+(.+)$/;

export function openTodos(body: string): string[] {
  return body.split("\n").flatMap((l) => {
    const m = l.match(TODO_LINE);
    return m ? [m[2].trim()] : [];
  });
}

/**
 * Send a note's "[ ] …" lines to the list, and mark them "[>]" — the bullet
 * journal sign for "moved elsewhere" — so the note still reads true afterwards
 * and the same lines are not sent twice.
 */
export function sendTodos(noteId: string, now = new Date()): CaptureResult | null {
  const n = state.db.notes[noteId];
  if (!n) return null;
  const todos = openTodos(n.body);
  if (todos.length === 0) return null;
  const res = capture(todos.join("\n"), now);
  const body = n.body
    .split("\n")
    .map((l) => l.replace(TODO_LINE, (_m, lead: string, rest: string) => `${lead}[>] ${rest}`))
    .join("\n");
  write([{ ...n, body, updatedAt: iso(now) }]);
  res.undo.push(n);
  return res;
}

// ---------------------------------------------------------------------------
// Housekeeping, sync and backup
// ---------------------------------------------------------------------------

/** Housekeeping is worked out on each device and never synced as an edit (see tidy). */
export function runTidy(now = new Date()) {
  if (!state.loaded) return;
  write(tidy(Object.values(state.db.tasks), workDay(now), now), false);
}

function find(id: string): Rec | undefined {
  return state.db.tasks[id] ?? state.db.notes[id];
}

/**
 * Merge records that came from somewhere else. Newer wins, per record.
 * `fromServer` records are already synced; imported ones still need pushing.
 */
export function merge(incoming: unknown[], fromServer: boolean): number {
  const take: Rec[] = [];
  for (const raw of incoming) {
    const r = normalize(raw);
    if (!r) continue;
    const mine = find(r.id);
    if (!mine || r.updatedAt > mine.updatedAt) {
      take.push(r);
      if (fromServer) dirty.delete(r.id);
    } else if (fromServer && r.updatedAt < mine.updatedAt) {
      dirty.add(r.id); // ours is newer — make sure it goes up
    }
  }
  write(take, !fromServer);
  if (fromServer && take.length === 0) persist();
  return take.length;
}

export function dirtyRecords(): Rec[] {
  return [...dirty].map(find).filter((r): r is Rec => !!r);
}

/** Mark pushed records clean — unless they changed again while the push was in flight. */
export function markClean(pushed: Rec[]) {
  for (const p of pushed) {
    const cur = find(p.id);
    if (!cur || cur.updatedAt === p.updatedAt) dirty.delete(p.id);
  }
  persist();
}

/** Everything is unsynced — used on first sign-in so this device's data goes up. */
export function markAllDirty() {
  for (const id of Object.keys(state.db.tasks)) dirty.add(id);
  for (const id of Object.keys(state.db.notes)) dirty.add(id);
  persist();
}

export function exportJSON(): string {
  return JSON.stringify(
    {
      app: "founder-os",
      v: 1,
      exportedAt: new Date().toISOString(),
      tasks: Object.values(state.db.tasks),
      notes: Object.values(state.db.notes),
    },
    null,
    2,
  );
}

export function importJSON(text: string): number {
  const parsed = JSON.parse(text) as { tasks?: unknown[]; notes?: unknown[] };
  if (!parsed || (!Array.isArray(parsed.tasks) && !Array.isArray(parsed.notes))) {
    throw new Error("That file is not a FounderOS backup.");
  }
  return merge([...(parsed.tasks ?? []), ...(parsed.notes ?? [])], false);
}

/** Test seam: start from a known state without touching localStorage. */
export function __setForTest(db: DB) {
  state = { loaded: true, db, saveFailed: false };
  dirty = new Set();
}
