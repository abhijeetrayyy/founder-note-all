import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getTask, getProjects } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { TaskActions } from "./task-actions";
import { TaskBreakdown } from "@/components/task-breakdown";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [task, allProjects] = await Promise.all([getTask(id), getProjects()]);
  if (!task) notFound();
  const project = task.project_id ? allProjects.find((p) => p.id === task.project_id) : null;
  const energyLabels = ["Admin", "Medium", "Deep"];
  const energyColors = ["text-emerald-400", "text-blue-400", "text-purple-400"];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/tasks" className="text-sm font-semibold text-foreground-muted hover:text-foreground transition-colors">← Back to Tasks</Link>
        <TaskActions taskId={task.id} completed={task.completed} />
      </div>

      <Card variant="focused" className="p-6 space-y-6">
        <div className="flex items-center gap-2 flex-wrap">
          {task.is_inbox && <span className="text-2xs font-bold px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-400">Inbox</span>}
          {task.completed && <span className="text-2xs font-bold px-2.5 py-1 rounded-full bg-state-done/10 text-state-done">Done</span>}
        </div>

        <h1 className={`text-2xl font-bold text-foreground leading-snug font-display ${task.completed ? "line-through text-foreground-subtle" : ""}`}>
          {task.title}
        </h1>

        {task.description && <p className="text-sm text-foreground-muted leading-relaxed whitespace-pre-wrap">{task.description}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-base-border">
          <div><p className="text-2xs uppercase tracking-wider text-foreground-subtle font-bold">Energy</p><p className={`text-sm font-semibold mt-1 ${energyColors[task.energy_level ?? 1]}`}>{energyLabels[task.energy_level ?? 1]}</p></div>
          <div><p className="text-2xs uppercase tracking-wider text-foreground-subtle font-bold">Estimate</p><p className="text-sm font-semibold mt-1">{task.estimated_minutes ? `${task.estimated_minutes} min` : "—"}</p></div>
          <div><p className="text-2xs uppercase tracking-wider text-foreground-subtle font-bold">Due</p><p className="text-sm font-semibold mt-1">{task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "—"}</p></div>
          <div><p className="text-2xs uppercase tracking-wider text-foreground-subtle font-bold">Priority</p><p className="text-sm font-semibold mt-1">{["Low","Medium","High"][task.priority]}</p></div>
        </div>

        {project && (
          <div className="pt-4 border-t border-base-border">
            <p className="text-2xs uppercase tracking-wider text-foreground-subtle font-bold mb-1.5">Project</p>
            <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
              <span className="w-5 h-5 rounded-md" style={{ backgroundColor: `#${project.color.toString(16).padStart(6,"0")}` }} />
              {project.name}
            </Link>
          </div>
        )}

        <p className="text-xs text-foreground-subtle pt-1">Created {new Date(task.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
      </Card>

      {!task.completed && <TaskBreakdown task={task} />}

      {!task.completed && (
        <Link href={`/focus?task=${task.id}`}
          className="flex items-center justify-center gap-2.5 h-12 rounded-xl text-white font-bold text-sm bg-gradient-to-br from-accent-600 to-accent-700 hover:shadow-glow-strong transition-all duration-300 focus-ring active:scale-[0.98]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          Start a focus session
        </Link>
      )}
    </div>
  );
}
