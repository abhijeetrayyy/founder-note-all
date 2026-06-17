import { getInboxTasks, getProjects } from "@/lib/data";
import { Card, SectionLabel } from "@/components/ui/card";
import { TaskList } from "@/components/task-list";

export default async function InboxPage() {
  const [tasks, projects] = await Promise.all([getInboxTasks(), getProjects()]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold">Inbox</h1>
        <p className="text-text-muted dark:text-dark-text-muted mt-1">Unsorted captures waiting to be organized.</p>
      </header>

      <Card className="p-5">
        <SectionLabel className="mb-4">INBOX ({tasks.length})</SectionLabel>
        <TaskList
          tasks={tasks}
          projects={projects}
          emptyTitle="Inbox zero"
          emptySubtitle="Your inbox is clear. Use Quick Add to capture anything on your mind."
        />
      </Card>
    </div>
  );
}
