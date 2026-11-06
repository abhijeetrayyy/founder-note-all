"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { shortDay, workDay } from "@/lib/dates";
import { useToday } from "@/lib/hooks";
import { LIST_HOLDS, MAX_STARS } from "@/lib/model";
import { parseCapture, splitDump, type Literal } from "@/lib/parse";
import { shelve } from "@/lib/rank";
import { capture, getState, undoCapture, type CaptureResult } from "@/lib/store";
import { toast } from "@/lib/toast";
import { Plus, Star, Sun, X } from "./icons";

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
  // Say so the moment the list overflows, not days later when things fade.
  const now = new Date();
  const over = shelve(Object.values(getState().db.tasks), workDay(now), now).over;
  if (over > 0) s += ` · your list is ${over} over ${LIST_HOLDS}`;
  return s;
}

function Chip({ children, tone, onClear, label }: { children: React.ReactNode; tone: "pen" | "plain"; onClear: () => void; label: string }) {
  return (
    <button
      type="button"
      // Keep focus in the input so typing carries on after the tap.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClear}
      title={`Tap if you didn't mean ${label}`}
      aria-label={`Don't read this as ${label}`}
      className={clsx(
        "group flex items-center gap-1 rounded-md px-2 py-1 text-[12px]",
        tone === "pen" ? "bg-pen-tint font-medium text-pen" : "bg-sunk text-ink-2",
      )}
    >
      {children}
      <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
    </button>
  );
}

/**
 * The one way in. Always on screen, always a task, never a form.
 * Enter adds. Paste several lines and each becomes its own task.
 */
export function Capture() {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  // Readings the person tapped away: "no, I meant the word".
  const [literal, setLiteral] = useState<Literal>({});
  const ref = useRef<HTMLInputElement>(null);
  const today = useToday();
  const parsed = useMemo(
    () => (text.trim() && today ? parseCapture(text, today, literal) : null),
    [text, today, literal],
  );

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
    const res = capture(raw, new Date(), literal);
    if (!res.added.length && !res.bumped.length) return;
    setText("");
    setLiteral({});
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
          onChange={(e) => {
            setText(e.target.value);
            if (!e.target.value) setLiteral({});
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            // Esc steps out of the box; what you typed stays put.
            if (e.key === "Escape") ref.current?.blur();
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
              <Chip tone="plain" label="a star" onClear={() => setLiteral((l) => ({ ...l, star: true }))}>
                <Star filled className="h-3 w-3" /> Star
              </Chip>
            )}
            {parsed.today && (
              <Chip tone="pen" label="today" onClear={() => setLiteral((l) => ({ ...l, today: true }))}>
                <Sun className="h-3 w-3" /> Today
              </Chip>
            )}
            {parsed.due && today && (
              <Chip tone="plain" label="a deadline" onClear={() => setLiteral((l) => ({ ...l, due: true }))}>
                Due {shortDay(parsed.due, today)}
              </Chip>
            )}
          </span>
        ) : (
          !focused && (
            <kbd className="hidden shrink-0 rounded border border-hair px-1.5 py-0.5 font-mono text-[11px] text-ink-3 md:block">/</kbd>
          )
        )}
      </label>
      {focused && !text && (
        <p className="pointer-events-none absolute inset-x-0 top-full z-10 mt-2 animate-fade rounded-xl border border-hair bg-card px-4 py-3 text-[13px] leading-relaxed text-ink-2 shadow-lift">
          Goes to your list. Add <b className="font-medium text-ink">today</b> to put it on Today, a day like{" "}
          <b className="font-medium text-ink">fri</b> or <b className="font-medium text-ink">12 nov</b> for a deadline,{" "}
          <b className="font-medium text-ink">!</b> to star it. Paste a list to add many at once.
        </p>
      )}
    </form>
  );
}
