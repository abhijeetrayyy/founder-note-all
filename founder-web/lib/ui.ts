"use client";

import { useSyncExternalStore } from "react";
import { dismiss } from "./toast";

/** Which sheet is open. Any row anywhere can open a task; the header opens sync. */

/** `rewrite`: opened to make a stuck task smaller — the title is selected, ready to retype. */
type Open = { kind: "task"; id: string; rewrite?: boolean } | { kind: "sync" } | null;

let open: Open = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// Opening a sheet clears any toast — on a phone it would sit over the sheet's buttons.
export const openTask = (id: string, opts: { rewrite?: boolean } = {}) => {
  dismiss();
  open = { kind: "task", id, rewrite: opts.rewrite };
  emit();
};
export const openSync = () => {
  dismiss();
  open = { kind: "sync" };
  emit();
};
export const getSheet = () => open;
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
