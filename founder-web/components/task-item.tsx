"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isToday, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toggleTask, deleteTask } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { priorityLabel, energyLabel, type Task, type Project } from "@/lib/supabase/types";

function dueLabel(dueDate: string) {
  const d = new Date(dueDate);
  if (isToday(d)) return "Today";
  return format(d, "MMM d");
}

export function TaskItem({ task, project, href }: { task: Task; project?: Project; href?: string }) {
  const router = useRouter(); const toast = useToast();
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(task.completed);
  const linkHref = href ?? `/tasks/${task.id}`;

  async function onToggle(e: React.MouseEvent) { e.preventDefault(); if (pending) return; setPending(true); const r = await toggleTask(task.id, !done); setPending(false); if (r.error) toast.show(r.error, "error"); else { setDone(!done); router.refresh(); } }
  async function onDelete(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); if (!confirm("Delete?")) return; const r = await deleteTask(task.id); if (r.error) toast.show(r.error, "error"); else router.refresh(); }

  return (
    <Link href={linkHref} className={cn("group flex items-start gap-3 p-3.5 rounded-xl transition-all duration-200", done ? "bg-base-overlay/50 border border-base-border/50" : "bg-base-surface border border-base-border hover:border-accent/20 hover:bg-base-raised")}>
      <button onClick={onToggle} className="mt-0.5 focus-ring shrink-0">
        <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200", done ? "border-state-done bg-state-done" : "border-base-border group-hover:border-accent/40")}>
          {done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>}
        </div>
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold leading-snug", done ? "line-through text-foreground-muted" : "text-foreground")}>{task.title}</p>
        {task.description && <p className="mt-1 text-xs text-foreground-muted line-clamp-2">{task.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {task.priority > 0 && <Badge variant={task.priority === 2 ? "warning" : "tonal"}>{priorityLabel(task.priority as 0|1|2)}</Badge>}
          {task.energy_level >= 0 && <Badge variant="tonal">{energyLabel(task.energy_level as 0|1|2)}</Badge>}
          {task.due_date && (
            <Badge variant={!done && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) ? "danger" : "default"}>
              {dueLabel(task.due_date)}
            </Badge>
          )}
          {project && <Badge variant="default">{project.name}</Badge>}
          {task.estimated_minutes && <span className="text-2xs text-foreground-subtle">{task.estimated_minutes}m</span>}
        </div>
      </div>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 focus:opacity-100 w-8 h-8 rounded-lg hover:bg-state-overdue/5 text-foreground-muted hover:text-state-overdue flex items-center justify-center focus-ring shrink-0 transition-all" aria-label="Delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
      </button>
    </Link>
  );
}
