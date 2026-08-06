"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { toggleTask, deleteTask, updateTask } from "@/lib/actions";

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

  async function onDelete() {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    setPending(true);
    const result = await deleteTask(taskId);
    setPending(false);
    if (result.error) toast.show(result.error, "error");
    else {
      toast.show("Task deleted", "success");
      router.push("/tasks");
      router.refresh();
    }
  }

  async function onMakeMIT() {
    setPending(true);
    const result = await updateTask(taskId, { priority: 2, is_inbox: false });
    setPending(false);
    if (result.error) toast.show(result.error, "error");
    else {
      toast.show("Marked as high priority / MIT", "success");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggle}
        disabled={pending}
        className="h-9 px-3.5 rounded-xl bg-gradient-to-br from-accent-600 to-accent-700 text-white text-sm font-bold hover:shadow-glow-strong transition-all focus-ring disabled:opacity-50"
      >
        {completed ? "Reopen" : "Complete"}
      </button>
      {!completed ? (
        <button
          onClick={onMakeMIT}
          disabled={pending}
          className="h-9 px-3.5 rounded-xl text-foreground-muted hover:text-foreground hover:bg-base-raised transition-colors text-sm font-bold focus-ring disabled:opacity-50"
        >
          Mark MIT
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
