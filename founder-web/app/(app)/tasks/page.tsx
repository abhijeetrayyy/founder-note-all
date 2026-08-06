import { getTasks, getProjects } from "@/lib/data";
import { TaskItem } from "@/components/task-item";
import { CreateTaskButton } from "@/components/create-task-button";

export default async function TasksPage() {
  const [tasks, projects] = await Promise.all([getTasks(), getProjects()]);
  const open = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight font-display">Tasks</h1>
          <p className="text-sm text-foreground-muted">{open.length} open · {done.length} completed</p>
        </div>
        <CreateTaskButton projects={projects} />
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-2xs uppercase tracking-[0.15em] text-foreground-muted font-bold">Open</p>
            <span className="text-2xs bg-accent-muted text-accent px-2.5 h-5 rounded-full flex items-center font-bold">{open.length}</span>
          </div>
        </div>
        {open.length ? (
          <div className="space-y-2">
            {open.map((task) => (<TaskItem key={task.id} task={task} />))}
          </div>
        ) : (
          <div className="rounded-card glass-ambient p-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-accent-muted flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <p className="text-sm font-semibold text-foreground">All caught up</p>
            <p className="text-xs text-foreground-muted mt-1">Capture something new to get started.</p>
          </div>
        )}
      </section>

      {done.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-2xs uppercase tracking-[0.15em] text-foreground-subtle font-bold">Completed</p>
              <span className="text-2xs bg-state-done-surface text-state-done px-2.5 h-5 rounded-full flex items-center font-bold">{done.length}</span>
            </div>
          </div>
          <div className="space-y-2 opacity-50">
            {done.map((task) => (<TaskItem key={task.id} task={task} />))}
          </div>
        </section>
      )}
    </div>
  );
}
