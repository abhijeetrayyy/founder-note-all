"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { shortDay } from "@/lib/dates";
import { useToday } from "@/lib/hooks";
import { MAX_STARS } from "@/lib/model";
import { parseCapture, splitDump } from "@/lib/parse";
import { capture, undoCapture, type CaptureResult } from "@/lib/store";
import { toast } from "@/lib/toast";
import { Plus, Star, Sun } from "./icons";

function say(r: CaptureResult, today: string): string {
  const n = r.added.length;
  const b = r.bumped.length;
  const all = [...r.added, ...r.bumped];
  const toToday = all.every((t) => t.pickedFor === today);
  let s: string;
  if (n + b === 1) {
    const t = all[0];
    if (b) s = toToday ? "Already on your list — put it on Today" : "Already on your list — moved it up";
    else if (toToday) s = "Added to Today";
    else if (t.due) s = `Added, due ${shortDay(t.due, today)}`;
    else s = "Added to your list";
  } else {
    const onToday = all.filter((t) => t.pickedFor === today).length;
    s = `Added ${n}${b ? `, ${b} already there` : ""}${onToday ? ` · ${onToday} on Today` : ""}`;
  }
  if (r.starRefused) s += ` · ${MAX_STARS} already starred, so no star`;
  return s;
}

/**
 * The one way in. Always on screen, always a task, never a form.
 * Enter adds. Paste several lines and each becomes its own task.
 */
export function Capture() {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const today = useToday();
  const parsed = useMemo(() => (text.trim() && today ? parseCapture(text, today) : null), [text, today]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (document.querySelector("[role=dialog]")) return;
      if (e.key === "/" || e.key === "n") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submit(raw: string) {
    if (!raw.trim() || !today) return;
    const res = capture(raw);
    if (!res.added.length && !res.bumped.length) return;
    setText("");
    toast(say(res, today), { label: "Undo", run: () => undoCapture(res) });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(text);
      }}
      className="relative"
    >
      <label
        className={clsx(
          "flex h-14 items-center gap-3 rounded-xl border bg-card px-4 shadow-card transition-colors",
          focused ? "border-pen/50" : "border-hair",
        )}
      >
        <Plus className={clsx("h-5 w-5 shrink-0 transition-colors", focused ? "text-pen" : "text-ink-3")} />
        <span className="sr-only">Add a task</span>
        <input
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setText("");
              ref.current?.blur();
            }
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            if (splitDump(pasted).length > 1) {
              e.preventDefault();
              submit(text.trim() ? `${text}\n${pasted}` : pasted);
            }
          }}
          placeholder="Dump a task…"
          enterKeyHint="done"
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-ink-3 focus-visible:outline-none"
        />
        {parsed && (parsed.today || parsed.due || parsed.starred) ? (
          <span className="flex shrink-0 items-center gap-1.5">
            {parsed.starred && (
              <span className="flex items-center gap-1 rounded-md bg-sunk px-2 py-1 text-[12px] text-ink-2">
                <Star filled className="h-3 w-3" /> Star
              </span>
            )}
            {parsed.today && (
              <span className="flex items-center gap-1 rounded-md bg-pen-tint px-2 py-1 text-[12px] font-medium text-pen">
                <Sun className="h-3 w-3" /> Today
              </span>
            )}
            {parsed.due && today && (
              <span className="rounded-md bg-sunk px-2 py-1 text-[12px] text-ink-2">Due {shortDay(parsed.due, today)}</span>
            )}
          </span>
        ) : (
          !focused && (
            <kbd className="hidden shrink-0 rounded border border-hair px-1.5 py-0.5 font-mono text-[11px] text-ink-3 md:block">/</kbd>
          )
        )}
      </label>
      {focused && !text && (
        <p className="pointer-events-none absolute left-4 right-4 top-full mt-2 animate-fade text-[12.5px] text-ink-3">
          Goes to your list. Type <b className="font-medium text-ink-2">today</b> to put it on Today, a day like{" "}
          <b className="font-medium text-ink-2">fri</b> or <b className="font-medium text-ink-2">12 nov</b> for a deadline,{" "}
          <b className="font-medium text-ink-2">!</b> to star. Paste a list to add many.
        </p>
      )}
    </form>
  );
}
