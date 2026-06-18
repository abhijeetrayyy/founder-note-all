"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toggleTask, deleteTask } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { priorityLabel, energyLabel, type Task, type Project } from "@/lib/supabase/types";

export function TaskItem({ task, project, href }: { task: Task; project?: Project; href?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState(false);
  const linkHref = href ?? `/tasks/${task.id}`;

  async function onToggle() {
    if (pending) return;
    setPending(true);
    const result = await toggleTask(task.id, !task.completed);
    setPending(false);
    if (result.error) toast.show(result.error, "error");
    else router.refresh();
  }

  async function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this task?")) return;
    const result = await deleteTask(task.id);
    if (result.error) toast.show(result.error, "error");
    else router.refresh();
  }

  return (
    <Link
      href={linkHref}
      className={cn(
        "group flex items-start gap-3 p-4 rounded-2xl border transition",
        task.completed
          ? "bg-surface-alt/50 dark:bg-dark-surface-alt/50 border-border dark:border-dark-border"
          : "bg-surface dark:bg-dark-surface border-border dark:border-dark-border hover:shadow-card hover:border-primary/30",
      )}
    >
      <div onClick={(e) => e.preventDefault()}>
        <Checkbox checked={task.completed} onChange={onToggle} boxSize="md" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-semibold text-[15px] leading-snug", task.completed && "line-through text-text-muted dark:text-dark-text-muted")}>
          {task.title}
        </p>
        {task.description ? (
          <p className="mt-1 text-sm text-text-muted dark:text-dark-text-muted line-clamp-2">{task.description}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {task.priority > 0 && (
            <Badge variant={task.priority === 2 ? "danger" : task.priority === 1 ? "warning" : "default"}>{priorityLabel(task.priority as 0 | 1 | 2)}</Badge>
          )}
          {task.energy_level >= 0 && <Badge variant="tonal">{energyLabel(task.energy_level as 0 | 1 | 2)}</Badge>}
          {task.due_date && <Badge variant="default">{task.due_date}</Badge>}
          {project && <Badge variant="tonal">{project.name}</Badge>}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition w-9 h-9 rounded-xl hover:bg-danger/10 text-text-muted hover:text-danger flex items-center justify-center focus-ring shrink-0"
        aria-label="Delete task"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </Link>
  );
}
