"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateGoalProgress } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import type { Goal } from "@/lib/supabase/types";

export function GoalCard({ goal }: { goal: Goal }) {
  const router = useRouter();
  const toast = useToast();
  const [progress, setProgress] = React.useState(goal.progress);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setProgress(v);
    const result = await updateGoalProgress(goal.id, v);
    if (result.error) toast.show(result.error, "error");
    else router.refresh();
  }

  return (
    <div className="p-4 rounded-2xl border bg-surface dark:bg-dark-surface border-border dark:border-dark-border">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-[15px]">{goal.title}</h3>
          {goal.description ? <p className="mt-1 text-sm text-text-muted dark:text-dark-text-muted line-clamp-2">{goal.description}</p> : null}
        </div>
        <span className="text-sm font-extrabold text-primary">{progress}%</span>
      </div>
      <div className="mt-4">
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={onChange}
          className="w-full h-2 rounded-lg bg-surface-alt dark:bg-dark-surface-alt accent-primary cursor-pointer"
        />
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-alt dark:bg-dark-surface-alt overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
      {goal.target_date && (
        <p className="mt-3 text-xs text-text-muted dark:text-dark-text-muted">Target: {goal.target_date}</p>
      )}
    </div>
  );
}
