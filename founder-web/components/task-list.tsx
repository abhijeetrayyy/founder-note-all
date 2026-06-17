"use client";

import { TaskItem } from "@/components/task-item";
import { EmptyState } from "@/components/ui/card";
import type { Task, Project } from "@/lib/supabase/types";

export function TaskList({ tasks, projects, emptyTitle, emptySubtitle }: { tasks: Task[]; projects: Project[]; emptyTitle: string; emptySubtitle: string }) {
  if (!tasks.length) {
    return (
      <EmptyState
        icon={<CheckCircleIcon />}
        title={emptyTitle}
        subtitle={emptySubtitle}
      />
    );
  }
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} project={task.project_id ? projectMap.get(task.project_id) : undefined} />
      ))}
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
