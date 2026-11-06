"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import * as A from "@/lib/actions";
import { addDays, dayKey, shortDay } from "@/lib/dates";
import { useShelf, useStore, useToday } from "@/lib/hooks";
import type { Shelf } from "@/lib/rank";
import { FADE_DAYS, type Task } from "@/lib/model";
import { deleteTask, editTask, restore, setDue, unsnooze } from "@/lib/store";
import { toast } from "@/lib/toast";
import { closeSheet } from "@/lib/ui";
import { Back, Check, Moon, Restore, Star, Sun, Trash } from "./icons";
import { Sheet } from "./sheet";

function where(t: Task, today: string, shelf: Shelf | null): { text: string; tone: string } {
  if (t.status === "done") return { text: `Done ${t.doneAt ? shortDay(dayKey(new Date(t.doneAt)), today) : ""}`, tone: "text-ink-2" };
  if (t.status === "let-go") {
    const when = t.letGoAt ? shortDay(dayKey(new Date(t.letGoAt)), today) : "";
    return { text: t.letGoReason === "faded" ? `Cleared ${when} after fading` : `Let go ${when}`, tone: "text-ink-3" };
  }
  if (t.pickedFor === today) return { text: "On Today", tone: "text-pen" };
  if (t.snoozedUntil && t.snoozedUntil > today) return { text: `Snoozed till ${shortDay(t.snoozedUntil, today)}`, tone: "text-ink-2" };
  const fading = shelf?.fading.find((f) => f.task.id === t.id);
  if (fading) {
    return {
      text: fading.clearsIn > 0 ? `Fading — clears in ${fading.clearsIn} ${fading.clearsIn === 1 ? "day" : "days"} unless you keep it` : "Fading — clears today unless you keep it",
      tone: "text-red",
    };
  }
  const rank = shelf?.ranked.findIndex((r) => r.task.id === t.id) ?? -1;
  if (rank >= 0) {
    const why = shelf!.ranked[rank].why;
    return { text: `#${rank + 1} on your list${why ? ` · ${why}` : ""}`, tone: "text-ink-2" };
  }
  if (t.due) return { text: `Under Later — due ${shortDay(t.due, today)}`, tone: "text-ink-2" };
  return { text: "On your list", tone: "text-ink-2" };
}

function AutoText({
  value,
  onSave,
  className,
  placeholder,
  minRows = 1,
}: {
  value: string;
  onSave: (v: string) => void;
  className: string;
  placeholder?: string;
  minRows?: number;
}) {
  const [v, setV] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(v);
  latest.current = v;
  const save = useRef(onSave);
  save.current = onSave;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [v]);

  // Flush on unmount so closing the sheet mid-sentence still saves.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    save.current(latest.current);
  }, []);

  return (
    <textarea
      ref={ref}
      value={v}
      rows={minRows}
      placeholder={placeholder}
      onChange={(e) => {
        setV(e.target.value);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => save.current(latest.current), 400);
      }}
      onBlur={() => save.current(latest.current)}
      className={clsx("w-full resize-none bg-transparent outline-none placeholder:text-ink-3", className)}
    />
  );
}

export function TaskSheet({ id }: { id: string }) {
  const { db } = useStore();
  const today = useToday();
  const shelf = useShelf();
  const t = db.tasks[id];
  const [snoozing, setSnoozing] = useState(false);
  const dateInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!t || t.deleted) closeSheet();
  }, [t]);

  if (!t || t.deleted || !today) return null;
  const place = where(t, today, shelf);
  const open = t.status === "open";
  const onToday = open && t.pickedFor === today;

  const after = (fn: () => void) => () => {
    fn();
    closeSheet();
  };

  const snoozeTo = (days: number, label: string) => after(() => A.snooze(t.id, addDays(today, days), label));

  const facts = [
    `Added ${shortDay(dayKey(new Date(t.createdAt)), today)}`,
    t.bumps > 0 && `written down ${t.bumps + 1} times`,
    t.skips > 0 && `carried over ${t.skips} ${t.skips === 1 ? "time" : "times"}`,
  ].filter(Boolean);

  return (
    <Sheet label="Task" onClose={closeSheet}>
      <div className="px-5 pb-5 pt-5 sm:px-6">
        <p className={clsx("pr-10 text-[12.5px] font-medium", place.tone)}>{place.text}</p>

        <AutoText
          key={`title-${t.id}`}
          value={t.title}
          onSave={(v) => editTask(t.id, { title: v })}
          className="mt-2 font-display text-[22px] font-medium leading-tight tracking-tight"
        />
        <AutoText
          key={`details-${t.id}`}
          value={t.details}
          onSave={(v) => editTask(t.id, { details: v })}
          placeholder="Details, links, the first step…"
          minRows={2}
          className="mt-2 text-[15px] leading-relaxed text-ink-2"
        />

        {open && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-hair pt-4">
            {onToday ? (
              <button type="button" className="btn-quiet border border-hair" onClick={after(() => A.unpick(t.id))}>
                <Back className="h-4 w-4" /> Back to list
              </button>
            ) : (
              <button type="button" className="btn border border-pen/30 bg-pen-tint text-pen hover:border-pen/60" onClick={after(() => A.pick([t.id]))}>
                <Sun className="h-4 w-4" /> Do today
              </button>
            )}
            <button
              type="button"
              aria-pressed={t.starred}
              className={clsx("btn border", t.starred ? "border-ink/20 bg-sunk text-ink" : "border-hair text-ink-2 hover:bg-sunk")}
              onClick={() => A.star(t.id)}
            >
              <Star filled={t.starred} className="h-4 w-4" /> {t.starred ? "Starred" : "Star"}
            </button>
            {t.snoozedUntil && t.snoozedUntil > today ? (
              <button type="button" className="btn border border-hair text-ink-2 hover:bg-sunk" onClick={() => unsnooze(t.id)}>
                <Moon className="h-4 w-4" /> Wake up now
              </button>
            ) : (
              <button
                type="button"
                aria-expanded={snoozing}
                className={clsx("btn border text-ink-2 hover:bg-sunk", snoozing ? "border-ink/20 bg-sunk" : "border-hair")}
                onClick={() => setSnoozing((s) => !s)}
              >
                <Moon className="h-4 w-4" /> Not now
              </button>
            )}
            <span className="relative">
              <button
                type="button"
                className="btn border border-hair text-ink-2 hover:bg-sunk"
                onClick={() => {
                  const el = dateInput.current;
                  if (!el) return;
                  try {
                    el.showPicker();
                  } catch {
                    el.focus();
                  }
                }}
              >
                {t.due ? `Due ${shortDay(t.due, today)}` : "Deadline"}
              </button>
              <input
                ref={dateInput}
                type="date"
                tabIndex={-1}
                value={t.due ?? ""}
                onChange={(e) => setDue(t.id, e.target.value || null)}
                className="pointer-events-none absolute bottom-0 left-0 h-px w-px opacity-0"
                aria-label="Deadline"
              />
            </span>
            {t.due && (
              <button type="button" className="btn-quiet h-9 px-2 text-[13px]" onClick={() => setDue(t.id, null)}>
                Clear deadline
              </button>
            )}
          </div>
        )}

        {open && snoozing && (
          <div className="mt-3 animate-rise rounded-xl bg-sunk p-3">
            <p className="text-[13px] text-ink-2">Hide it from the list until…</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className="btn border border-hair bg-card" onClick={snoozeTo(1, "tomorrow")}>Tomorrow</button>
              <button type="button" className="btn border border-hair bg-card" onClick={snoozeTo(7, shortDay(addDays(today, 7), today))}>In a week</button>
              <button type="button" className="btn border border-hair bg-card" onClick={snoozeTo(30, shortDay(addDays(today, 30), today))}>In a month</button>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 border-t border-hair pt-4">
          {open ? (
            <>
              <button type="button" className="btn-ink" onClick={after(() => A.done(t.id))}>
                <Check className="h-4 w-4" strokeWidth={2.5} /> Mark done
              </button>
              <button type="button" className="btn-quiet ml-auto" onClick={after(() => A.letGo(t.id))}>
                Let go
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-ink" onClick={after(() => A.restoreTask(t.id))}>
                <Restore className="h-4 w-4" /> {t.status === "done" ? "Not done — reopen" : "Restore to list"}
              </button>
              <button
                type="button"
                className="btn-quiet ml-auto"
                onClick={after(() => {
                  const prev = deleteTask(t.id);
                  toast("Deleted", { label: "Undo", run: () => restore(prev) });
                })}
              >
                <Trash className="h-4 w-4" /> Delete
              </button>
            </>
          )}
        </div>

        <p className="mt-4 font-mono text-[11.5px] text-ink-3">{facts.join(" · ")}</p>
        {open && !onToday && (
          <p className="mt-1 text-[12px] text-ink-3">
            Untouched for 3 weeks, or ranked below 30, it fades — and clears {FADE_DAYS} days later unless kept.
          </p>
        )}
      </div>
    </Sheet>
  );
}
