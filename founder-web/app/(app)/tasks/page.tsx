import { getTasks, getProjects } from "@/lib/data";
import { TaskItem } from "@/components/task-item";
import { CreateTaskButton } from "@/components/create-task-button";

export default async function TasksPage() {
  const [tasks, projects] = await Promise.all([getTasks(), getProjects()]);
  const open = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-foreground-muted mt-1">{open.length} open · {done.length} done</p>
        </div>
        <CreateTaskButton projects={projects} />
      </header>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-2xs uppercase tracking-[0.15em] text-foreground-muted font-bold">Open</p>
            <span className="text-2xs bg-base-raised text-foreground-muted px-2 h-5 rounded-full flex items-center font-semibold">
              {open.length}
            </span>
          </div>
          {open.length ? (
            <div className="space-y-2">
              {open.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="rounded-card glass-ambient p-8 text-center">
              <p className="text-sm text-foreground-muted">All caught up. Capture something new.</p>
            </div>
          )}
        </div>

        {done.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-2xs uppercase tracking-[0.15em] text-foreground-subtle font-bold">Completed</p>
              <span className="text-2xs bg-state-done-surface text-state-done px-2 h-5 rounded-full flex items-center font-semibold">
                {done.length}
              </span>
            </div>
            <div className="space-y-2 opacity-60">
              {done.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
