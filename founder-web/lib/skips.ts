"use client";

import { useSyncExternalStore } from "react";
import { addDays, diffDays, type DayKey } from "./dates";

/**
 * Questions you skipped, and the day each may be asked again. Kept on this
 * device only — skipping is a "not now", not a fact about the task worth syncing.
 */

const KEY = "fos.skips";
const SHOWN_KEY = "fos.asked";
type Skips = Record<string, DayKey>;

/** Questions shown today. The list asks at most DAILY_QUESTIONS different ones a day. */
let shown: { day: DayKey; keys: string[] } = { day: "", keys: [] };

let skips: Skips = {};
let loaded = false;
const listeners = new Set<() => void>();
const EMPTY: Skips = {};

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    skips = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Skips;
    shown = JSON.parse(localStorage.getItem(SHOWN_KEY) ?? '{"day":"","keys":[]}');
  } catch {
    skips = {};
  }
}

export function shownToday(today: DayKey): string[] {
  load();
  return shown.day === today ? shown.keys : [];
}

export function markShown(key: string, today: DayKey) {
  load();
  const keys = shown.day === today ? shown.keys : [];
  if (keys.includes(key)) return;
  shown = { day: today, keys: [...keys, key] };
  try {
    localStorage.setItem(SHOWN_KEY, JSON.stringify(shown));
  } catch {}
}

export function skip(key: string, days: number, today: DayKey) {
  load();
  const next: Skips = {};
  for (const [k, until] of Object.entries(skips)) if (diffDays(until, today) > 0) next[k] = until;
  next[key] = addDays(today, days);
  skips = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(skips));
  } catch {}
  for (const l of listeners) l();
}

export function useSkips(): Skips {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => {
      load();
      return skips;
    },
    () => EMPTY,
  );
}
