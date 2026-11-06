"use client";

import { useMemo, useSyncExternalStore } from "react";
import { workDay } from "./dates";
import type { Note, Task } from "./model";
import { shelve, type Shelf } from "./rank";
import { getServerState, getState, subscribe } from "./store";
import { getSync, subscribeSync } from "./sync";

export function useStore() {
  return useSyncExternalStore(subscribe, getState, getServerState);
}

export function useSync() {
  return useSyncExternalStore(subscribeSync, getSync, getSync);
}

// ---------------------------------------------------------------------------
// The clock. One shared minute tick, so "today" flips for every screen at once.
// ---------------------------------------------------------------------------

let clock: Date | null = null;
const clockListeners = new Set<() => void>();
let ticking = false;

function tick() {
  const n = new Date();
  // Only publish when the minute changes, so components are not re-rendered
  // every few seconds for nothing.
  if (!clock || Math.floor(n.getTime() / 60_000) !== Math.floor(clock.getTime() / 60_000)) {
    clock = n;
    for (const l of clockListeners) l();
  }
}

function subscribeClock(l: () => void) {
  clockListeners.add(l);
  if (!ticking && typeof window !== "undefined") {
    ticking = true;
    tick();
    setInterval(tick, 15_000);
    document.addEventListener("visibilitychange", tick);
  }
  return () => {
    clockListeners.delete(l);
  };
}

/** Null until mounted — the server has no idea what day it is for you. */
export function useNow(): Date | null {
  return useSyncExternalStore(subscribeClock, () => clock, () => null);
}

export function useToday(): string | null {
  const now = useNow();
  return now ? workDay(now) : null;
}

export function useTasks(): Task[] {
  const { db } = useStore();
  return useMemo(() => Object.values(db.tasks).filter((t) => !t.deleted), [db.tasks]);
}

export function useNotes(): Note[] {
  const { db } = useStore();
  return useMemo(() => Object.values(db.notes).filter((n) => !n.deleted), [db.notes]);
}

export function useShelf(): Shelf | null {
  const tasks = useTasks();
  const now = useNow();
  return useMemo(() => (now ? shelve(tasks, workDay(now), now) : null), [tasks, now]);
}
