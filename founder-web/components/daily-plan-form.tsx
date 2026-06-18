"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Textarea, Input } from "@/components/ui/input";
import type { Task, DailyPlan } from "@/lib/supabase/types";
import { addMITAction, removeMITAction, updatePlanAction } from "@/lib/actions";

export function DailyPlanForm({ plan, allTasks }: { plan: DailyPlan | null; allTasks: Task[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState(false);
  const [intention, setIntention] = React.useState(plan?.intention_text ?? "");
  const [blockers, setBlockers] = React.useState(plan?.blocker_notes ?? "");
  const [reflection, setReflection] = React.useState(plan?.reflection_text ?? "");
  const [mitIds, setMitIds] = React.useState<string[]>(plan?.mit_task_ids ?? []);

  React.useEffect(() => {
    setIntention(plan?.intention_text ?? "");
    setBlockers(plan?.blocker_notes ?? "");
    setReflection(plan?.reflection_text ?? "");
    setMitIds(plan?.mit_task_ids ?? []);
  }, [plan?.id, plan?.intention_text, plan?.blocker_notes, plan?.reflection_text, plan?.mit_task_ids]);

  const availableTasks = React.useMemo(
    () => allTasks.filter((t) => !t.completed).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || (a.due_date ?? "").localeCompare(b.due_date ?? "")),
    [allTasks],
  );

  const selectedMits = React.useMemo(
    () => mitIds.map((id) => allTasks.find((t) => t.id === id)).filter((t): t is Task => Boolean(t)),
    [mitIds, allTasks],
  );

  async function savePlan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = new FormData();
    form.set("intention_text", intention);
    form.set("blocker_notes", blockers);
    form.set("reflection_text", reflection);
    form.set("mit_task_ids", mitIds.join(","));
    const result = await updatePlanAction(form);
    setPending(false);
    if (result.error) toast.show(result.error, "error");
    else {
      toast.show("Daily plan saved", "success");
      router.refresh();
    }
  }

  async function toggleMit(taskId: string) {
    if (mitIds.includes(taskId)) {
      setMitIds(mitIds.filter((id) => id !== taskId));
      setPending(true);
      const result = await removeMITAction(taskId);
      setPending(false);
      if (result.error) toast.show(result.error, "error");
      else router.refresh();
    } else {
      if (mitIds.length >= 3) {
        toast.show("You can only pick 3 MITs. Remove one first.", "error");
        return;
      }
      setMitIds([...mitIds, taskId]);
      setPending(true);
      const result = await addMITAction(taskId);
      setPending(false);
      if (result.error) toast.show(result.error, "error");
      else router.refresh();
    }
  }

  return (
    <form onSubmit={savePlan} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-bold text-text-muted dark:text-dark-text-muted">Today&apos;s intention</label>
        <Input
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          placeholder="Today I will focus on…"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-text-muted dark:text-dark-text-muted">Likely blockers</label>
        <Textarea
          value={blockers}
          onChange={(e) => setBlockers(e.target.value)}
          placeholder="What could get in the way?"
          rows={3}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-text-muted dark:text-dark-text-muted">YOUR MITs (max 3)</label>
          <span className="text-xs font-extrabold text-primary">{mitIds.length}/3</span>
        </div>

        {/* Selected MITs */}
        {selectedMits.length > 0 ? (
          <div className="space-y-2 mb-3">
            {selectedMits.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-2xl border border-primary/30 bg-primary/5">
                <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{t.title}</p>
                  {t.estimated_minutes ? (
                    <p className="text-xs text-text-muted dark:text-dark-text-muted">{t.estimated_minutes} min</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => toggleMit(t.id)}
                  disabled={pending}
                  className="text-xs font-bold text-danger hover:underline focus-ring"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted dark:text-dark-text-muted italic mb-3">No MITs picked yet. Choose 1-3 below.</p>
        )}

        {/* Picker */}
        {mitIds.length < 3 && availableTasks.length > 0 ? (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {availableTasks
              .filter((t) => !mitIds.includes(t.id))
              .slice(0, 12)
              .map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleMit(t.id)}
                  disabled={pending}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border bg-surface dark:bg-dark-surface border-border dark:border-dark-border hover:border-primary/40 hover:bg-primary/5 transition text-left focus-ring"
                >
                  <span className="w-6 h-6 rounded-full border-2 border-border dark:border-dark-border shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{t.title}</p>
                    <p className="text-xs text-text-muted dark:text-dark-text-muted">
                      {t.estimated_minutes ? `${t.estimated_minutes} min` : "No estimate"}
                      {t.due_date ? ` · ${t.due_date}` : ""}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        ) : null}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-text-muted dark:text-dark-text-muted">End-of-day reflection (optional)</label>
        <Textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="What did you ship? What's tomorrow look like?"
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full h-12" disabled={pending}>
        {pending ? "Saving…" : "Save plan"}
      </Button>
    </form>
  );
}
