"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { toggleTask, releaseLoop, restoreLoop, addMITAction } from "@/lib/actions";

export function TaskActions({ taskId, completed }: { taskId: string; completed: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState(false);

  async function onToggle() {
    setPending(true);
    const result = await toggleTask(taskId, !completed);
    setPending(false);
    if (result.error) toast.show(result.error, "error");
    else {
      toast.show(completed ? "Task reopened" : "Task completed", "success");
      router.refresh();
    }
  }

  // The second delete path. Like the one on list rows, this releases rather
  // than destroys — "this cannot be undone" was both hostile and, now, untrue.
  async function onDelete() {
    setPending(true);
    const result = await releaseLoop(taskId, "dropped from detail");
    setPending(false);
    if (result.error) { toast.show(result.error, "error"); return; }
    toast.show("Let go. Restorable for 30 days.", "info", {
      label: "Undo",
      onClick: async () => { await restoreLoop(taskId); router.refresh(); },
    });
    router.push("/loops");
    router.refresh();
  }

  /**
   * Put this on today's list.
   *
   * Was labelled "Mark MIT" and did not do it: it set priority and cleared the
   * inbox flag but never touched `daily_plans`, so the task was not among the
   * day's picks and Today never showed it. It goes through the same writer the
   * plan board uses, which is the only thing that actually commits a loop to a
   * day.
   */
  async function onPickForToday() {
    setPending(true);
    const result = await addMITAction(taskId);
    setPending(false);
    if (result.error) toast.show(result.error, "error");
    else {
      toast.show("On today's list", "success");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggle}
        disabled={pending}
        className="h-9 px-3.5 rounded-xl bg-[#F0F0EE] text-[#0B0B0D] text-sm font-bold hover:bg-white transition-all focus-ring disabled:opacity-50"
      >
        {completed ? "Reopen" : "Complete"}
      </button>
      {!completed ? (
        <button
          onClick={onPickForToday}
          disabled={pending}
          className="h-9 px-3.5 rounded-xl text-foreground-muted hover:text-foreground hover:bg-base-raised transition-colors text-sm font-bold focus-ring disabled:opacity-50"
        >
          Pick for today
        </button>
      ) : null}
      <button
        onClick={onDelete}
        disabled={pending}
        className="h-9 px-3.5 rounded-xl hover:bg-state-overdue-surface text-state-overdue text-sm font-bold focus-ring disabled:opacity-50 transition-colors"
      >
        Delete
      </button>
    </div>
  );
}
