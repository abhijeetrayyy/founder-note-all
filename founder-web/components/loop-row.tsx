"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, todayKey } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { answerLoop, restoreLoop, setNotThisWeek } from "@/lib/actions";
import { decayTone, loopAge, isOwedByYou, isBlockedOnThem } from "@/lib/loops";
import type { Task } from "@/lib/supabase/types";

/**
 * One loop in a list.
 *
 * Age is shown only where it means something — a scheduled task is not old, it
 * is scheduled — and the four answers are always one click away, because a
 * triage surface that makes you open a detail page to decide is a reading
 * surface, and reading the list is the thing founders already do too much of.
 */
export function LoopRow({ task, showAnswers = true }: { task: Task; showAnswers?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [gone, setGone] = React.useState(false);

  const tone = decayTone(task);
  const age = loopAge(task);
  const owed = isOwedByYou(task);
  const blocked = isBlockedOnThem(task);
  const released = !!task.released_at;
  const isDecision = task.kind === 1;

  async function run(key: string, fn: () => Promise<{ error?: string }>, msg?: string) {
    setBusy(key);
    const r = await fn();
    if (r.error) { toast.show(r.error, "error"); setBusy(null); return; }
    if (msg) toast.show(msg, "success");
    setGone(true);
    setTimeout(() => router.refresh(), 320);
  }

  return (
    <div
      className={cn( "rounded-xl border p-3.5 transition-all duration-300",
        gone && "animate-dissolve pointer-events-none",
        released && "opacity-60 border-base-border bg-base-overlay/40",
        !released && tone === "rotting" && "border-state-overdue/40 bg-state-overdue-surface",
        !released && tone === "aging" && "border-state-attention/35 bg-state-attention-surface",
        !released && tone === "fresh" && "border-base-border bg-base-surface hover:border-accent/20",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Decay is carried in form as well as words, so the shelf reads at a glance. */}
        <span
          aria-hidden="true"
          className={cn( "mt-1.5 w-1.5 h-1.5 rounded-full flex-none",
            tone === "rotting" ? "bg-state-overdue" : tone === "aging" ? "bg-state-attention" : "bg-foreground-faint",
          )}
        />
        <div className="flex-1 min-w-0">
          <Link href={`/tasks/${task.id}`} className="block hover:text-accent transition-colors">
            <p className="text-sm font-semibold text-foreground leading-snug">{task.title}</p>
          </Link>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-2xs">
            {isDecision && (
              <span className="px-1.5 py-0.5 rounded bg-accent-muted text-accent font-bold uppercase tracking-wider">
                Decision
              </span>
            )}
            {owed && (
              <span className="font-semibold text-state-overdue">
                {task.owed_to} is waiting
              </span>
            )}
            {blocked && (
              <span className="font-semibold text-foreground-muted">
                waiting on {task.owed_to}
              </span>
            )}
            {age !== null && age > 0 && (
              <span
                className={cn( "number-mono",
                  tone === "rotting" ? "text-state-overdue" : tone === "aging" ? "text-state-attention" : "text-foreground-subtle",
                )}
              >
                {age}d raw
              </span>
            )}
            {task.not_this_week && (
              <span className="text-foreground-subtle italic">
                not this week{task.anti_reason ? ` — ${task.anti_reason}` : ""}
              </span>
            )}
            {released && task.release_reason && (
              <span className="text-foreground-subtle italic">{task.release_reason}</span>
            )}
          </div>
        </div>
      </div>

      {released ? (
        <div className="mt-3 pl-4.5">
          <Answer label="Bring it back" busy={busy === "restore"} onClick={() => run("restore", () => restoreLoop(task.id), "Back on the list")} />
        </div>
      ) : showAnswers ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Answer label="Today" tone="accent" busy={busy === "do"}
            onClick={() => run("do", () => answerLoop(task.id, "do", { dueDate: todayKey() }))} />
          <Answer label="Tomorrow" busy={busy === "sched"}
            onClick={() => run("sched", () => answerLoop(task.id, "schedule", { dueDate: todayKey(new Date(Date.now() + 86400000)) }))} />
          <Answer label="Not this week" busy={busy === "anti"}
            onClick={() => run("anti", () => setNotThisWeek(task.id, true), "Named and parked")} />
          <Answer label="Let it go" tone="danger" busy={busy === "drop"}
            onClick={() => run("drop", () => answerLoop(task.id, "drop"), "Released — restorable for 30 days")} />
        </div>
      ) : null}
    </div>
  );
}

function Answer({ label, onClick, busy, tone }: { label: string; onClick: () => void; busy: boolean; tone?: "accent" | "danger" }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={cn( "h-8 px-3 rounded-full text-xs font-semibold transition-colors focus-ring disabled:opacity-50",
        tone === "accent" && "bg-accent-600 text-[#0B0B0D] hover:bg-white",
        tone === "danger" && "text-state-overdue hover:bg-state-overdue-surface",
        !tone && "bg-base-raised text-foreground-muted hover:bg-base-overlay",
      )}
    >
      {label}
    </button>
  );
}
