"use client";

import { useSyncExternalStore } from "react";

/** Which sheet is open. Any row anywhere can open a task; the header opens sync. */

type Open = { kind: "task"; id: string } | { kind: "sync" } | null;

let open: Open = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const openTask = (id: string) => {
  open = { kind: "task", id };
  emit();
};
export const openSync = () => {
  open = { kind: "sync" };
  emit();
};
export const closeSheet = () => {
  open = null;
  emit();
};

export function useSheet(): Open {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => open,
    () => null,
  );
}
