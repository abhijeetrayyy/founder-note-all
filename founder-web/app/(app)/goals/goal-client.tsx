"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { updateGoalProgress, createGoalMilestone, toggleGoalMilestone, killGoal } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { Meter } from "@/components/ui/card";
import { cn, todayKey } from "@/lib/utils";
import type { Goal, GoalMilestone } from "@/lib/supabase/types";

export function GoalClient({ goal, milestones }: { goal: Goal; milestones: GoalMilestone[] }) {
  const router = useRouter();
  const toast = useToast();
  const [progress, setProgress] = React.useState(goal.progress);
  const [newMilestone, setNewMilestone] = React.useState("");
  const [expanded, setExpanded] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const today = todayKey();
  const isOverdue = goal.target_date ? goal.target_date < today && progress < 100 : false;
  const isDueSoon = goal.target_date ? goal.target_date > today && new Date(goal.target_date).getTime() - Date.now() < 7 * 86400000 : false;

  async function onProgress(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setProgress(v);
    const result = await updateGoalProgress(goal.id, v);
    if (result.error) toast.show(result.error, "error");
    else router.refresh();
  }

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!newMilestone.trim()) return;
    setPending(true);
    const form = new FormData();
    form.set("goal_id", goal.id);
    form.set("title", newMilestone);
    const result = await createGoalMilestone(form);
    setPending(false);
    if (result.error) toast.show(result.error, "error");
    else { setNewMilestone(""); router.refresh(); }
  }

  async function toggleMilestone(mId: string, completed: boolean) {
    const result = await toggleGoalMilestone(mId, !completed);
    if (result.error) toast.show(result.error, "error");
    else router.refresh();
  }

  // Killing a goal archives it and releases the loops that only existed to
  // serve it. Deleting the goal alone left the work behind with nothing left to
  // justify itself against, so the pruning reduced nothing.
  async function onDelete() {
    const result = await killGoal(goal.id, "goal dropped");
    if (result.error) { toast.show(result.error, "error"); return; }
    toast.show(
      result.released ? `Goal dropped · ${result.released} loops released` : "Goal dropped",
      "success",
    );
    router.refresh();
  }

  // Drift: nothing has moved this in a while. A warning that only warns is a
  // nag, so it comes with the question and the exit rather than a red dot.
  const idleDays = Math.floor((Date.now() - new Date(goal.updated_at).getTime()) / 86_400_000);
  const drifting = idleDays >= 10 && progress < 100;

  const ringColor = progress >= 75 ? "stroke-state-done" : progress >= 40 ? "stroke-accent" : "stroke-state-attention";

  return (
    <div className="p-4 rounded-card glass-ambient">
      {drifting && (
        <div className="mb-3 -mt-1 flex items-start gap-2.5 p-3 rounded-xl bg-state-attention-surface border border-state-attention/30">
          <span aria-hidden="true" className="mt-1.5 w-1.5 h-1.5 rounded-full bg-state-attention flex-none" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground">
              Nothing has moved this in {idleDays} days.
            </p>
            <p className="mt-0.5 text-[12.5px] text-foreground-muted">
              Is it dead, or is it the only thing that matters? Both are fine answers — leaving it
              undecided is the one that costs you.
            </p>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Meter value={progress / 100} size={44} strokeWidth={4} className={ringColor}>
            <span className="text-2xs font-extrabold text-foreground number-mono">{progress}</span>
          </Meter>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[15px] text-foreground truncate">{goal.title}</h3>
              {isOverdue ? <span className="text-2xs font-extrabold text-state-overdue shrink-0">OVERDUE</span> : null}
              {isDueSoon ? <span className="text-2xs font-extrabold text-state-attention shrink-0">DUE SOON</span> : null}
            </div>
            {goal.description ? <p className="mt-0.5 text-sm text-foreground-muted line-clamp-2">{goal.description}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-foreground-muted hover:text-accent transition-colors focus-ring">
            {expanded ? "▼" : "▶"}
          </button>
          <button onClick={onDelete} className="text-xs font-semibold text-state-overdue hover:underline focus-ring">Delete</button>
        </div>
      </div>

      <div className="mt-4">
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={onProgress}
          aria-label={`Goal progress: ${progress}%`}
          className="w-full h-2 rounded-lg bg-base-overlay accent-accent cursor-pointer"
        />
      </div>

      {goal.target_date && (
        <p className={cn("mt-3 text-xs font-bold", isOverdue ? "text-state-overdue" : "text-foreground-muted")}>
          Target: {format(new Date(goal.target_date), "MMM d, yyyy")}
        </p>
      )}

      {expanded && (
        <div className="mt-4 pt-3 border-t border-base-border space-y-2">
          <p className="text-2xs uppercase tracking-wider font-bold text-foreground-muted">Milestones</p>
          {milestones.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <button
                onClick={() => toggleMilestone(m.id, m.is_completed)}
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-all focus-ring",
                  m.is_completed ? "bg-state-done border-state-done text-white" : "border-base-border",
                )}
              >
                {m.is_completed && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
                )}
              </button>
              <span className={cn("text-sm text-foreground", m.is_completed && "line-through text-foreground-muted")}>{m.title}</span>
            </div>
          ))}
          <form onSubmit={addMilestone} className="flex gap-2 mt-2">
            <input
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              placeholder="Add milestone"
              className="flex-1 h-9 rounded-xl bg-base-raised border-0 px-3 text-sm text-foreground placeholder:text-foreground-subtle outline-none focus:ring-2 focus:ring-accent/30"
            />
            <button type="submit" disabled={pending || !newMilestone.trim()} className="text-xs font-bold text-accent hover:underline disabled:opacity-50 focus-ring">
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
