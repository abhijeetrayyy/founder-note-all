import type { Task } from "@/lib/supabase/types";

/**
 * The loop model, as pure functions.
 *
 * Every rule about pressure, decay and capacity lives here so there is exactly
 * one place to argue with it — and so none of it drifts into a component where
 * it quietly becomes three slightly different rules.
 */

// ---------------------------------------------------------------------------
// Decay
// ---------------------------------------------------------------------------

/** Days a raw loop gets before it starts to age. Capture is free inside this. */
export const GRACE_DAYS = 7;
/** Days after which a raw loop is rotting and sorts to the top of triage. */
export const ROT_DAYS = 14;
/** Friday amnesty releases raw loops older than this. */
export const AMNESTY_DAYS = 21;
/** How long a released loop stays restorable. */
export const RESTORE_DAYS = 30;

export type DecayTone = "fresh" | "aging" | "rotting";

export function daysSince(iso: string, now: Date = new Date()): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.floor((now.getTime() - then) / 86_400_000));
}

/**
 * How old a loop feels.
 *
 * Only raw loops decay. Once a loop has been answered it is a plan, not
 * pressure — a scheduled task three months out is not rotting, it is simply
 * scheduled, and colouring it red would be a lie.
 */
export function decayTone(task: Task, now: Date = new Date()): DecayTone {
  if (task.answered_at) return "fresh";
  const age = daysSince(task.created_at, now);
  if (age >= ROT_DAYS) return "rotting";
  if (age >= GRACE_DAYS) return "aging";
  return "fresh";
}

/** Age in days, but only for loops where age means something. */
export function loopAge(task: Task, now: Date = new Date()): number | null {
  if (task.answered_at) return null;
  return daysSince(task.created_at, now);
}

// ---------------------------------------------------------------------------
// Owed
// ---------------------------------------------------------------------------

export const OwedDirection = { theyWait: 0, youWait: 1 } as const;

export function isOwedByYou(task: Task): boolean {
  return task.owed_to.trim() !== "" && task.owed_direction === OwedDirection.theyWait;
}

export function isBlockedOnThem(task: Task): boolean {
  return task.owed_to.trim() !== "" && task.owed_direction === OwedDirection.youWait;
}

// ---------------------------------------------------------------------------
// Pressure
// ---------------------------------------------------------------------------

export interface Pressure {
  owed_count: number;
  blocked_count: number;
  rotting_count: number;
  aging_count: number;
  unclear_count: number;
}

export const EMPTY_PRESSURE: Pressure = {
  owed_count: 0, blocked_count: 0, rotting_count: 0, aging_count: 0, unclear_count: 0,
};

export interface PressureLine {
  /** The sentence, already written. Never a score. */
  text: string;
  /** Where the founder goes to make it smaller. */
  href: string;
  /** Severity, for tone only — never rendered as a number. */
  tone: "urgent" | "warn" | "calm";
  key: keyof Pressure;
}

/**
 * Turn the counts into sentences, most pressing first.
 *
 * Ordered by felt weight rather than by size: a person waiting three days
 * outweighs four tasks rotting for thirty, because the loop a founder actually
 * carries is the obligation, not the row.
 */
export function pressureLines(p: Pressure): PressureLine[] {
  const lines: PressureLine[] = [];

  if (p.owed_count > 0) {
    lines.push({
      key: "owed_count",
      tone: "urgent",
      href: "/loops?filter=owed",
      text: p.owed_count === 1
        ? "1 person is waiting on you"
        : `${p.owed_count} people are waiting on you`,
    });
  }
  if (p.rotting_count > 0) {
    lines.push({
      key: "rotting_count",
      tone: "urgent",
      href: "/loops?filter=rotting",
      text: p.rotting_count === 1
        ? "1 loop is rotting"
        : `${p.rotting_count} loops are rotting`,
    });
  }
  if (p.unclear_count > 0) {
    lines.push({
      key: "unclear_count",
      tone: "warn",
      href: "/loops?filter=unclear",
      text: p.unclear_count === 1
        ? "1 loop has no next move"
        : `${p.unclear_count} loops have no next move`,
    });
  }
  if (p.blocked_count > 0) {
    lines.push({
      key: "blocked_count",
      tone: "warn",
      href: "/unblock",
      text: p.blocked_count === 1
        ? "You are waiting on 1 person"
        : `You are waiting on ${p.blocked_count} people`,
    });
  }
  if (p.aging_count > 0) {
    lines.push({
      key: "aging_count",
      tone: "calm",
      href: "/loops?filter=aging",
      text: p.aging_count === 1
        ? "1 loop is starting to age"
        : `${p.aging_count} loops are starting to age`,
    });
  }

  return lines;
}

/** True when there is genuinely nothing pressing. Worth saying out loud. */
export function isClear(p: Pressure): boolean {
  return pressureLines(p).length === 0;
}

// ---------------------------------------------------------------------------
// Capacity
// ---------------------------------------------------------------------------

/**
 * The starting guess, not the truth.
 *
 * These are a default to be corrected by observation, never a wall. `capacityFit`
 * returns advice; deciding to go over is the founder's call, and the override is
 * worth more as data than the block would have been as enforcement.
 */
export const DEFAULT_CAPACITY = { deep: 3, medium: 4, admin: 8 } as const;

export type CapacityShape = { deep: number; medium: number; admin: number };

export interface Prefs {
  capacity: CapacityShape;
  planAt: string;
  shutdownAt: string;
}

export const DEFAULT_PREFS: Prefs = {
  capacity: { ...DEFAULT_CAPACITY },
  planAt: "09:00",
  shutdownAt: "19:00",
};

/**
 * Read preferences out of the profile's jsonb blob, clamping anything absurd.
 *
 * Capacity was previously a constant the founder could not touch, which made
 * the app's most confident moment — telling you the day is full — also the one
 * most likely to be wrong.
 */
export function readPrefs(raw: unknown): Prefs {
  const p = (raw ?? {}) as Partial<Prefs> & { capacity?: Partial<CapacityShape> };
  const clamp = (v: unknown, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && n <= 24 ? Math.round(n) : fallback;
  };
  const time = (v: unknown, fallback: string) =>
    typeof v === "string" && /^\d{2}:\d{2}$/.test(v) ? v : fallback;

  return {
    capacity: {
      deep: clamp(p.capacity?.deep, DEFAULT_CAPACITY.deep),
      medium: clamp(p.capacity?.medium, DEFAULT_CAPACITY.medium),
      admin: clamp(p.capacity?.admin, DEFAULT_CAPACITY.admin),
    },
    planAt: time(p.planAt, DEFAULT_PREFS.planAt),
    shutdownAt: time(p.shutdownAt, DEFAULT_PREFS.shutdownAt),
  };
}

export interface CapacityFit {
  used: CapacityShape;
  limit: CapacityShape;
  over: (keyof CapacityShape)[];
  /** Advice, phrased as a fact rather than a refusal. Null when it fits. */
  advice: string | null;
}

const ENERGY_KEY: Record<number, keyof CapacityShape> = { 0: "admin", 1: "medium", 2: "deep" };

export function capacityFit(tasks: Task[], limit: CapacityShape = { ...DEFAULT_CAPACITY }): CapacityFit {
  const used: CapacityShape = { deep: 0, medium: 0, admin: 0 };
  for (const t of tasks) {
    if (t.completed) continue;
    used[ENERGY_KEY[t.energy_level] ?? "medium"] += 1;
  }

  const over = (Object.keys(used) as (keyof CapacityShape)[]).filter((k) => used[k] > limit[k]);
  if (over.length === 0) return { used, limit, over, advice: null };

  const worst = over[0];
  const excess = used[worst] - limit[worst];
  return {
    used, limit, over,
    advice: `That is ${excess} more ${worst} ${excess === 1 ? "block" : "blocks"} than a day of yours usually holds.`,
  };
}

/**
 * What the founder's real deep-work number looks like, from what actually
 * happened rather than from what we assumed. Returns null until there is
 * enough history to say anything honest.
 */
export function observedCapacity(
  deepBlocksByDay: number[],
  assumed: number = DEFAULT_CAPACITY.deep,
): { real: number; days: number; hitRate: number } | null {
  if (deepBlocksByDay.length < 10) return null;
  const hits = deepBlocksByDay.filter((n) => n >= assumed).length;
  const hitRate = hits / deepBlocksByDay.length;
  if (hitRate >= 0.4) return null; // the assumption is holding; say nothing

  const sorted = [...deepBlocksByDay].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return { real: Math.max(1, median), days: deepBlocksByDay.length, hitRate };
}

// ---------------------------------------------------------------------------
// Nudges
// ---------------------------------------------------------------------------

/**
 * A message you would actually send.
 *
 * Short, no apology, no "just checking in" — those read as nagging and are the
 * reason founders leave these unsent. States the thing, states what unblocks it,
 * and gives the other person an easy out. The draft is a starting point that is
 * always editable; the value is in never facing a blank field.
 */
export function draftNudge(task: Task, from?: string | null): string {
  const who = task.owed_to.trim().split(/\s+/)[0] || "there";
  const days = daysSince(task.updated_at || task.created_at);
  const waited = days >= 2 ? ` It has been ${days} days, so I want to make sure it did not get buried.` : "";
  const sign = from?.trim() ? `\n\n— ${from.trim().split(/\s+/)[0]}` : "";

  if (task.kind === 1) {
    const unlock = task.decision_unlock.trim();
    return `Hi ${who} — I am still holding off on "${task.title}".${waited}`
      + (unlock ? ` What would settle it: ${unlock}.` : "")
      + ` Anything you can share this week, or should I decide without it?${sign}`;
  }

  const step = task.first_step.trim();
  return `Hi ${who} — checking on "${task.title}".${waited}`
    + (step ? ` The next bit is: ${step}.` : "")
    + ` Are you able to pick it up, or should it come back to me?${sign}`;
}

/**
 * The next move to offer when parking a loop at shutdown.
 *
 * Returns what the loop already carries when it has one, so the common case is
 * a tap rather than a sentence. The fallbacks are deliberately concrete and
 * small — "spend two minutes" is startable at 8am in a way that "finish the
 * pricing page" never is, and a founder at 7pm will accept a decent default
 * where they would abandon an empty field.
 */
export function draftNextMove(task: Task): string {
  const existing = task.first_step.trim();
  if (existing) return existing;

  if (task.kind === 1) {
    const unlock = task.decision_unlock.trim();
    return unlock ? `Get ${unlock}, then decide` : "Write down what would make this obvious";
  }
  if (isBlockedOnThem(task)) return `Chase ${task.owed_to.trim().split(/\s+/)[0]}`;
  if (isOwedByYou(task)) return `Send ${task.owed_to.trim().split(/\s+/)[0]} a holding reply`;

  return "Open it and spend two minutes";
}

// ---------------------------------------------------------------------------
// Triage lanes — "what is on fire, and what actually matters"
// ---------------------------------------------------------------------------

/**
 * The four lanes everything open falls into.
 *
 * A founder's real question in the morning is not "what is on my list" — they
 * know, it is the thing that woke them at 4am. It is "which of these actually
 * bites today, and which just feels loud". So the app answers it rather than
 * asking. Every lane here is DERIVED from facts already in the row — a person
 * attached, a date passed, a project it belongs to, the energy it costs.
 * Nothing here reads a self-assigned "urgent" flag first, because that flag is
 * the least reliable signal in the system: everything a founder types in feels
 * urgent at the moment they type it.
 *
 * Order is deliberate. `fire` outranks everything. `needle` outranks `rot`,
 * which is the non-obvious one: a deep-work loop captured three weeks ago and
 * never scheduled is not rubbish to be swept out, it is the important thing
 * being avoided, and filing it under "rot" would tell the founder to drop
 * exactly what they should be protecting.
 */
export type Lane = "fire" | "needle" | "rot" | "noise";

export const LANES: { key: Lane; label: string; blurb: string; tone: string }[] = [
  { key: "fire",   label: "On fire",       tone: "#FF8A4C", blurb: "Someone gets hurt, or something breaks, if today ends without these." },
  { key: "needle", label: "Moves the needle", tone: "#F0F0EE", blurb: "Nothing important moves unless you protect time for these." },
  { key: "rot",    label: "Been sitting",  tone: "#E0A33E", blurb: "Old, and nothing about them is load-bearing. Answer or let go — do not schedule." },
  { key: "noise",  label: "Noise",         tone: "#9C9CA4", blurb: "Feels urgent. Is not. Batch it into one admin block, or drop it." },
];

export interface LaneVerdict {
  lane: Lane;
  /** Why THIS row landed here, as a fact. Never the lane's name back at you. */
  why: string;
}

function firstName(s: string) { return s.trim().split(/\s+/)[0]; }

/**
 * The local calendar day a stored value falls on, as YYYY-MM-DD.
 *
 * The two date columns in this schema are not the same shape: `due_date` is a
 * `timestamptz` and comes back as "2026-08-12T00:00:00+00:00", while
 * `decide_by` is a plain `date` and comes back as "2026-08-12". Comparing them
 * the same way silently produced NaN for one of the two — overdue loops never
 * reached the fire lane at all, which is the single worst thing this file could
 * get wrong. Bare dates are passed through untouched rather than fed to
 * `new Date`, which would read them as UTC midnight and land on the previous
 * day for anyone west of Greenwich.
 */
export function dayKey(value: string | null | undefined): string | null {
  const s = (value ?? "").trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Whole days from `today` to the stored date. Negative means it has passed. */
function dayDelta(stored: string, today: string): number | null {
  const key = dayKey(stored);
  if (!key) return null;
  const a = Date.parse(`${key}T00:00:00`);
  const b = Date.parse(`${today}T00:00:00`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((a - b) / 86_400_000);
}

/**
 * Which lane a loop is in, and the sentence that justifies it.
 *
 * `today` is passed in rather than read from the clock so the server and the
 * browser cannot disagree about what day it is — they are routinely in
 * different timezones, and a task silently changing lanes on hydration is the
 * kind of bug that makes an app feel untrustworthy.
 */
export function laneOf(task: Task, today: string, now: Date = new Date()): LaneVerdict {
  const owedDays = daysSince(task.updated_at || task.created_at, now);

  // ── Fire. Something outside your head is already affected.
  if (task.due_date) {
    const d = dayDelta(task.due_date, today);
    if (d !== null && d < 0) {
      return { lane: "fire", why: `Was due ${-d === 1 ? "yesterday" : `${-d} days ago`}.` };
    }
  }
  if (task.kind === 1 && task.decide_by) {
    const d = dayDelta(task.decide_by, today);
    if (d !== null && d <= 0) {
      return { lane: "fire", why: d === 0 ? "The decision is due today." : `The decision was due ${-d} days ago.` };
    }
  }
  if (isOwedByYou(task)) {
    return owedDays >= 2
      ? { lane: "fire", why: `${firstName(task.owed_to)} has been waiting ${owedDays} days.` }
      : { lane: "fire", why: `${firstName(task.owed_to)} is waiting on you.` };
  }

  // ── Needle. Nothing breaks today, but nothing moves without it either.
  if (task.kind === 1) {
    return { lane: "needle", why: "An open decision. Everything downstream of it is stalled." };
  }
  if (task.energy_level === 2) {
    return { lane: "needle", why: "Deep work. It only ever happens on a day you protect it." };
  }
  if (task.project_id) {
    return { lane: "needle", why: "Attached to a project — this is how that project moves." };
  }
  if (task.priority === 2) {
    return { lane: "needle", why: "You marked this high when you wrote it down." };
  }

  // ── Rot. Old and unattached. The honest read is: you are never doing this.
  const age = loopAge(task, now);
  if (age !== null && age >= ROT_DAYS) {
    return { lane: "rot", why: `Raw for ${age} days, with nobody and nothing waiting on it.` };
  }

  // ── Noise.
  if (isBlockedOnThem(task)) {
    return { lane: "noise", why: `Sitting with ${firstName(task.owed_to)}. Nudge it, do not schedule it.` };
  }
  if (task.energy_level === 0) {
    return { lane: "noise", why: "Admin. Worth ten minutes in a batch, not a slot in your day." };
  }
  return { lane: "noise", why: age && age >= GRACE_DAYS ? `Been around ${age} days without ever mattering.` : "Nothing is waiting on this." };
}

/** Group everything open into the four lanes, each already in triage order. */
export function byLane(tasks: Task[], today: string, now: Date = new Date()): Record<Lane, { task: Task; why: string }[]> {
  const out: Record<Lane, { task: Task; why: string }[]> = { fire: [], needle: [], rot: [], noise: [] };
  for (const t of tasks) {
    if (t.completed || t.released_at) continue;
    const v = laneOf(t, today, now);
    out[v.lane].push({ task: t, why: v.why });
  }
  for (const k of Object.keys(out) as Lane[]) {
    out[k].sort((a, b) => triageOrder(a.task, b.task, now));
  }
  return out;
}

// ---------------------------------------------------------------------------
// The picks
// ---------------------------------------------------------------------------

/** What you commit to. Three is the promise. */
export const COMMITTED_PICKS = 3;
/** A fourth is allowed, but it is explicitly a stretch, never a commitment. */
export const MAX_PICKS = 4;

/**
 * What the app should say back about a set of picks.
 *
 * This is the part a list cannot do. A founder who picks three admin tasks has
 * planned a day where the company does not move, and nothing on a checkbox list
 * will ever tell them that. Returns null when the selection is genuinely fine —
 * commentary on every plan is noise, and noise is how advice stops being read.
 */
export function planVerdict(
  picks: Task[],
  lanes: Lane[],
  fireCount: number,
): { text: string; tone: "warn" | "good" } | null {
  if (picks.length === 0) return null;

  const deep = picks.filter((t) => t.energy_level === 2).length;

  // The expensive mistake: fires burning while the day is spent elsewhere.
  const pickedFire = lanes.filter((l) => l === "fire").length;
  if (fireCount > 0 && pickedFire === 0) {
    return { tone: "warn", text: `${fireCount} ${fireCount === 1 ? "loop is" : "loops are"} on fire and you picked none of them. That is a choice — just make it on purpose.` };
  }

  // The quiet mistake: a full day that moves nothing.
  if (picks.length >= 2 && lanes.every((l) => l === "noise")) {
    return { tone: "warn", text: "Every pick is noise. You have planned a busy day in which the company does not move." };
  }

  if (deep >= 3) {
    return { tone: "warn", text: `Three deep blocks is more than almost any day actually holds. Expect to finish two — pick which two now rather than at 6pm.` };
  }

  if (lanes.includes("needle") && picks.length <= COMMITTED_PICKS) {
    return fireCount > 0
      ? { tone: "good", text: "Every fire is on the list and something load-bearing is protected. That is what a good day looks like on paper." }
      : { tone: "good", text: "Nothing is burning and you have protected something that matters. That is the whole game." };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export type LoopFilter =
  | "all" | "owed" | "blocked" | "rotting" | "aging" | "unclear" | "anti" | "released";

export const LOOP_FILTERS: { key: LoopFilter; label: string; blurb: string }[] = [
  { key: "all",      label: "Open",          blurb: "Everything still open." },
  { key: "owed",     label: "They're waiting", blurb: "Someone is waiting on you. Heaviest first." },
  { key: "blocked",  label: "You're waiting",  blurb: "Sitting with someone else." },
  { key: "rotting",  label: "Rotting",       blurb: "Raw for two weeks or more." },
  { key: "aging",    label: "Aging",         blurb: "Raw for a week. Not urgent yet." },
  { key: "unclear",  label: "No next move",  blurb: "Committed to a day with no first step written." },
  { key: "anti",     label: "Not this week", blurb: "Named on purpose so it stops chasing you." },
  { key: "released", label: "Released",      blurb: "Let go recently. Restorable for 30 days." },
];

export function isLoopFilter(v: string | undefined | null): v is LoopFilter {
  return !!v && LOOP_FILTERS.some((f) => f.key === v);
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

/**
 * Triage order. Obligations to people first, then rot, then age — priority is
 * the last tiebreak rather than the first, because self-assigned priority is
 * the least reliable signal in the system.
 */
export function triageOrder(a: Task, b: Task, now: Date = new Date()): number {
  const owed = Number(isOwedByYou(b)) - Number(isOwedByYou(a));
  if (owed !== 0) return owed;

  const ageA = loopAge(a, now) ?? -1;
  const ageB = loopAge(b, now) ?? -1;
  if (ageA !== ageB) return ageB - ageA;

  return b.priority - a.priority;
}
