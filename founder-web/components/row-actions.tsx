"use client";

import { useEffect, useState } from "react";
import * as A from "@/lib/actions";
import { Back, Check, Sun, Trash, X } from "./icons";
import type { SwipeAction } from "./swipe";

/** The swipe actions, named once so every screen's gestures mean the same thing. */

export const swipeToday = (id: string): SwipeAction => ({
  label: "Today",
  tone: "pen",
  icon: <Sun className="h-4 w-4" />,
  run: () => A.pick([id]),
});

export const swipeDelete = (id: string): SwipeAction => ({
  label: "Delete",
  tone: "red",
  icon: <Trash className="h-4 w-4" />,
  run: () => A.remove(id),
});

export const swipeDone = (id: string): SwipeAction => ({
  label: "Done",
  tone: "ink",
  icon: <Check className="h-4 w-4" strokeWidth={2.5} />,
  run: () => A.done(id),
});

export const swipeBack = (id: string): SwipeAction => ({
  label: "Back to list",
  tone: "pen",
  icon: <Back className="h-4 w-4" />,
  run: () => A.unpick(id),
});

export const swipeKeep = (id: string): SwipeAction => ({
  label: "Keep",
  tone: "pen",
  run: () => A.keep(id),
});

/** Hover buttons stand in for swipes on a desk — the same actions, visible. */
export function DeleteButton({ id, title }: { id: string; title: string }) {
  return (
    <button
      type="button"
      onClick={() => A.remove(id)}
      aria-label={`Delete "${title}"`}
      title="Delete"
      className="icon-btn hidden opacity-0 hover:text-red focus:opacity-100 group-hover:opacity-100 md:inline-flex"
    >
      <Trash className="h-4 w-4" />
    </button>
  );
}

const HINT_KEY = "fos.hint.swipe";

/**
 * Gestures can't be seen, so say it once — on a touch screen only, and never
 * again after it's dismissed or a swipe has been used.
 */
export function SwipeHint({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      setShow(window.matchMedia("(pointer: coarse)").matches && !localStorage.getItem(HINT_KEY));
    } catch {}
  }, []);
  if (!show) return null;
  return (
    <p className="mt-4 flex animate-rise items-center gap-2 rounded-lg bg-pen-tint px-3 py-2 text-[13px] text-pen">
      <span className="flex-1">{text}</span>
      <button type="button" aria-label="Got it" onClick={() => { swipeHintSeen(); setShow(false); }} className="-mr-1 rounded p-1">
        <X className="h-4 w-4" />
      </button>
    </p>
  );
}

export function swipeHintSeen() {
  try {
    localStorage.setItem(HINT_KEY, "1");
  } catch {}
}
