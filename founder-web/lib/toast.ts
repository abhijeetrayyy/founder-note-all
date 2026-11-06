"use client";

import { useSyncExternalStore } from "react";

/** One message at a time, bottom of the screen, with at most one action (usually Undo). */

export interface Toast {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
}

let current: Toast | null = null;
let seq = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function toast(text: string, action?: Toast["action"], ms = 5000) {
  current = { id: ++seq, text, action };
  if (timer) clearTimeout(timer);
  timer = setTimeout(dismiss, ms);
  emit();
}

export function dismiss() {
  current = null;
  emit();
}

export function useToast(): Toast | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => current,
    () => null,
  );
}
