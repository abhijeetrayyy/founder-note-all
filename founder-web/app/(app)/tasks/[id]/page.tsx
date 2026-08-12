import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getTask, getProjects, getTaskTags } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskActions } from "./task-actions";
import { TaskBreakdown } from "@/components/task-breakdown";
import { OwedControl } from "@/components/owed-control";
import { priorityLabel, energyLabel, recurrenceLabel } from "@/lib/supabase/types";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [task, allProjects, tags] = await Promise.all([getTask(id), getProjects(), getTaskTags(id)]);
  if (!task) notFound();
  const project = task.project_id ? allProjects.find((p) => p.id === task.project_id) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/tasks" className="text-sm font-semibold text-foreground-muted hover:text-foreground transition-colors">← Tasks</Link>
        <TaskActions taskId={task.id} completed={task.completed} />
      </div>

      <Card variant="focused" className="p-6 space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          {task.is_inbox && <Badge variant="warning">Inbox</Badge>}
          {task.priority > 0 && <Badge variant="tonal">{priorityLabel(task.priority as 0 | 1 | 2)}</Badge>}
          {task.completed && <Badge variant="success">Done</Badge>}
        </div>

        <h1 className={`text-2xl font-bold text-foreground leading-tight font-display ${task.completed ? "line-through text-foreground-muted" : ""}`}>{task.title}</h1>
        {task.description ? <p className="text-sm text-foreground-muted leading-relaxed whitespace-pre-wrap">{task.description}</p> : <p className="text-sm text-foreground-subtle italic">No description yet.</p>}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-base-border">
          <Detail label="Energy" value={task.energy_level >= 0 ? energyLabel(task.energy_level as 0 | 1 | 2) : "—"} />
          <Detail label="Estimate" value={task.estimated_minutes ? `${task.estimated_minutes} min` : "—"} />
          <Detail label="Due" value={task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "—"} />
          <Detail label="Recurrence" value={recurrenceLabel(task.recurrence as 0 | 1 | 2 | 3)} />
        </div>

        {project && (
          <div className="pt-4 border-t border-base-border">
            <p className="text-2xs uppercase tracking-wider text-foreground-muted font-bold mb-1">Project</p>
            <Link href={`/projects/${project.id}`} className="text-sm font-semibold text-accent hover:underline">{project.name}</Link>
          </div>
        )}
        {tags.length > 0 && (
          <div className="pt-4 border-t border-base-border">
            <p className="text-2xs uppercase tracking-wider text-foreground-muted font-bold mb-2">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t.id} className="text-xs font-semibold px-2.5 h-6 rounded-full flex items-center" style={{ background: `#${t.color.toString(16).padStart(6, "0")}20`, color: `#${t.color.toString(16).padStart(6, "0")}` }}>
                  #{t.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-foreground-subtle pt-1">Created {new Date(task.created_at).toLocaleDateString()}</p>
      </Card>

      {!task.completed && <TaskBreakdown task={task} />}

      {!task.completed && <OwedControl task={task} />}

      {!task.completed && (
        <Link
          href={`/focus?task=${task.id}`}
          className="flex items-center justify-center gap-2 h-12 rounded-xl text-white font-bold text-sm bg-gradient-to-br from-accent-600 to-accent-700 hover:shadow-glow-strong transition-all focus-ring"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          Start a focus session on this
        </Link>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xs text-foreground-muted uppercase tracking-wider font-bold">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
    </div>
  );
}
