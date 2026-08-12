"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { answerLoop, setNotThisWeek } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { todayKey, cn } from "@/lib/utils";
import type { Task } from "@/lib/supabase/types";

/**
 * One loop, and the four answers.
 *
 * Hand-off was missing entirely — the model's four answers are do it, schedule
 * it, hand it off, or drop it, and hand-off is the one that actually gets work
 * off a founder's plate. It was absent from the single surface built for
 * deciding.
 *
 * Keys 1–4 act on the focused row, so a full inbox can be cleared without
 * reaching for the mouse.
 */
export function InboxTriageItem({ task, focused, onFocus }: {
  task: Task;
  focused?: boolean;
  onFocus?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState<string | null>(null);
  const [gone, setGone] = React.useState(false);
  const [handoff, setHandoff] = React.useState(false);
  const [who, setWho] = React.useState("");

  const act = React.useCallback(async (action: string, run: () => Promise<{ error?: string }>) => {
    setPending(action);
    const r = await run();
    if (r.error) { toast.show(r.error, "error"); setPending(null); return; }
    setGone(true);
    setTimeout(() => router.refresh(), 320);
  }, [router, toast]);

  const doToday = React.useCallback(
    () => act("today", () => answerLoop(task.id, "do", { dueDate: todayKey() })), [act, task.id]);
  const doTomorrow = React.useCallback(
    () => act("tomorrow", () => answerLoop(task.id, "schedule", { dueDate: todayKey(new Date(Date.now() + 86400000)) })), [act, task.id]);
  const doPark = React.useCallback(
    () => act("park", () => setNotThisWeek(task.id, true)), [act, task.id]);
  const doDrop = React.useCallback(
    () => act("drop", () => answerLoop(task.id, "drop")), [act, task.id]);

  async function doHandoff() {
    if (!who.trim()) return;
    await act("handoff", () => answerLoop(task.id, "handoff", { owedTo: who }));
  }

  // 1 do · 2 schedule · 3 hand off · 4 drop, on the focused row only.
  React.useEffect(() => {
    if (!focused || gone) return;
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "1") { e.preventDefault(); doToday(); }
      if (e.key === "2") { e.preventDefault(); doTomorrow(); }
      if (e.key === "3") { e.preventDefault(); setHandoff(true); }
      if (e.key === "4") { e.preventDefault(); doDrop(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [focused, gone, doToday, doTomorrow, doDrop]);

  return (
    <div
      onMouseEnter={onFocus}
      className={cn(
        "rounded-[18px] border bg-[#FFFDF8] p-[18px] transition-all duration-300",
        focused ? "border-[#5B4FE9]" : "border-[#E6DFD2]",
        gone && "animate-dissolve pointer-events-none",
      )}
    >
      <Link href={`/tasks/${task.id}`} className="block mb-3 group">
        <p className="text-[14.5px] font-semibold leading-snug group-hover:text-[#5B4FE9] transition-colors">
          {task.title}
        </p>
        {task.description && (
          <p className="mt-1 text-[12.5px] text-[#8A8378] line-clamp-2">{task.description}</p>
        )}
      </Link>

      {handoff ? (
        <div className="flex flex-wrap gap-2">
          <input
            autoFocus
            value={who}
            onChange={(e) => setWho(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") doHandoff(); if (e.key === "Escape") setHandoff(false); }}
            placeholder="Who is picking this up?"
            className="flex-1 min-w-[12rem] h-8 px-3 rounded-full border border-[#E0D9CB] bg-[#FBF8F2] text-[12.5px] focus-ring"
          />
          <Btn label="Hand off" onClick={doHandoff} busy={pending === "handoff"} tone="accent" />
          <Btn label="Cancel" onClick={() => setHandoff(false)} busy={false} />
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          <Btn label="Do today" k="1" onClick={doToday} busy={pending === "today"} tone="accent" />
          <Btn label="Tomorrow" k="2" onClick={doTomorrow} busy={pending === "tomorrow"} />
          <Btn label="Hand off" k="3" onClick={() => setHandoff(true)} busy={pending === "handoff"} />
          <Btn label="Not this week" onClick={doPark} busy={pending === "park"} />
          <Btn label="Let it go" k="4" onClick={doDrop} busy={pending === "drop"} tone="danger" />
        </div>
      )}
    </div>
  );
}

function Btn({ label, onClick, busy, tone, k }: {
  label: string; onClick: () => void; busy: boolean; tone?: "accent" | "danger"; k?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={cn(
        "h-8 px-3 rounded-full text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition-colors focus-ring disabled:opacity-50",
        tone === "accent" && "bg-[#5B4FE9] text-white hover:bg-[#4A3EDA]",
        tone === "danger" && "text-[#D9552F] hover:bg-[#FBF0EA]",
        !tone && "bg-[#F1EDE3] text-[#6B6459] hover:bg-[#E7E0D2]",
      )}
    >
      {label}
      {k && <kbd className={cn("font-mono text-[9.5px] opacity-55", tone === "accent" && "text-white")}>{k}</kbd>}
    </button>
  );
}
