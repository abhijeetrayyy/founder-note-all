import { getTasks, getProjects } from "@/lib/data";
import { Card, SectionLabel } from "@/components/ui/card";
import { TaskList } from "@/components/task-list";
import { CreateTaskButton } from "@/components/create-task-button";

export default async function TasksPage() {
  const [tasks, projects] = await Promise.all([getTasks(), getProjects()]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Tasks</h1>
          <p className="text-text-muted dark:text-dark-text-muted mt-1">All your tasks, organized.</p>
        </div>
        <CreateTaskButton projects={projects} />
      </header>

      <Card className="p-5">
        <TaskList
          tasks={tasks.filter((t) => !t.completed)}
          projects={projects}
          emptyTitle="No open tasks"
          emptySubtitle="You're all caught up. Capture a new task to get started."
        />
      </Card>

      <SectionLabel>COMPLETED</SectionLabel>
      <Card className="p-5">
        <TaskList
          tasks={tasks.filter((t) => t.completed)}
          projects={projects}
          emptyTitle="No completed tasks"
          emptySubtitle="Complete a task and it will show up here."
        />
      </Card>
    </div>
  );
}

