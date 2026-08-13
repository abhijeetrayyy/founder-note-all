"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateTask } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { cn, todayKey } from "@/lib/utils";
import type { Task } from "@/lib/supabase/types";

type Reason = "big" | "unclear" | "energy" | "avoiding";

const REASONS: { key: Reason; label: string; prompt: string }[] = [
  { key: "big", label: "It's too big", prompt: "Name the smallest physical action that moves it forward — not the whole task, just the very first move." },
  { key: "unclear", label: "I don't know how to start", prompt: "What's the first thing you'd literally do — open a doc, send a message, make a call?" },
  { key: "energy", label: "Wrong energy right now", prompt: "This needs a different kind of focus than you have right now. Match it to today, or come back when you're ready." },
  { key: "avoiding", label: "I keep avoiding it", prompt: "Set a trigger so you don't have to decide in the moment — \"When ___ happens, I will ___.\"" },
];

export function TaskBreakdown({ task }: { task: Task }) {
  const router = useRouter();
  const toast = useToast();
  const [reason, setReason] = React.useState<Reason | null>(null);
  const [firstStep, setFirstStep] = React.useState(task.first_step ?? "");
  const [intention, setIntention] = React.useState(task.implementation_intention ?? "");
  const [saving, setSaving] = React.useState<string | null>(null);

  const hasBreakdown = Boolean(task.first_step || task.implementation_intention);
  const active = REASONS.find((r) => r.key === reason);

  async function save(field: "first_step" | "implementation_intention", value: string) {
    if (!value.trim()) return;
    setSaving(field);
    const r = await updateTask(task.id, { [field]: value.trim() });
    setSaving(null);
    if (r.error) { toast.show(r.error, "error"); return; }
    toast.show("Saved", "success");
    router.refresh();
  }

  async function matchToToday() {
    setSaving("energy");
    const r = await updateTask(task.id, { energy_level: 0, due_date: todayKey() });
    setSaving(null);
    if (r.error) { toast.show(r.error, "error"); return; }
    toast.show("Rescheduled as an admin task for today", "success");
    router.refresh();
  }

  return (
    <Card variant="ambient" className="p-5 space-y-4" id="breakdown">
      <div className="flex items-center justify-between">
        <p className="text-2xs uppercase tracking-[0.14em] text-foreground-subtle font-bold">
          {hasBreakdown ? "Getting started" : "Feeling stuck?"}
        </p>
      </div>

      {(task.first_step || !hasBreakdown) && (
        <div>
          <label className="block text-2xs uppercase tracking-wider text-foreground-muted font-bold mb-1.5">First step</label>
          <input
            value={firstStep}
            onChange={(e) => setFirstStep(e.target.value)}
            onBlur={() => firstStep.trim() !== (task.first_step ?? "") && save("first_step", firstStep)}
            placeholder="e.g. Open the doc and write one sentence"
            className="w-full h-11 rounded-xl px-3.5 text-sm bg-base-raised border border-base-border text-foreground placeholder:text-foreground-subtle outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all"
          />
        </div>
      )}

      {(task.implementation_intention || !hasBreakdown) && (
        <div>
          <label className="block text-2xs uppercase tracking-wider text-foreground-muted font-bold mb-1.5">Trigger (if–then)</label>
          <input
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            onBlur={() => intention.trim() !== (task.implementation_intention ?? "") && save("implementation_intention", intention)}
            placeholder="When I sit down after lunch, I will…"
            className="w-full h-11 rounded-xl px-3.5 text-sm bg-base-raised border border-base-border text-foreground placeholder:text-foreground-subtle outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all"
          />
        </div>
      )}

      {!hasBreakdown && (
        <div className="pt-1 space-y-3">
          <p className="text-sm text-foreground-muted">Not sure why you're avoiding this one? Pick what fits:</p>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setReason(reason === r.key ? null : r.key)}
                aria-pressed={reason === r.key}
                className={cn( "h-9 px-3.5 rounded-full text-xs font-semibold transition-all focus-ring",
                  reason === r.key ? "bg-accent-600 text-[#0B0B0D]" : "bg-base-raised text-foreground-muted hover:bg-base-overlay",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          {active && (
            <div className="p-3.5 rounded-xl bg-accent-muted border border-accent-muted-strong space-y-3 animate-fade-in">
              <p className="text-sm text-foreground leading-relaxed">{active.prompt}</p>
              {active.key === "energy" && (
                <button
                  onClick={matchToToday}
                  disabled={saving === "energy"}
                  className="h-9 px-4 rounded-xl bg-accent-600 text-[#0B0B0D] text-xs font-bold hover:bg-white transition-all focus-ring disabled:opacity-50"
                >
                  {saving === "energy" ? "Rescheduling…" : "Match to today's admin energy"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
