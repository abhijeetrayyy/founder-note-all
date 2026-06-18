import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getProjectTasks, getProjectNotes, getProjects } from "@/lib/data";
import { Card, SectionLabel } from "@/components/ui/card";
import { TaskList } from "@/components/task-list";
import { NoteCard } from "@/components/note-card";
import { CreateTaskButton } from "@/components/create-task-button";

const COLORS = ["#5B4FE9", "#14B8A6", "#F59E0B", "#EF4444", "#7C3AED", "#3B82F6"];

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [tasks, notes, allProjects] = await Promise.all([
    getProjectTasks(id),
    getProjectNotes(id),
    getProjects(),
  ]);

  const color = COLORS[project.color % COLORS.length];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Link href="/projects" className="text-sm font-bold text-text-muted dark:text-dark-text-muted hover:text-primary">
        ← Back to projects
      </Link>

      <Card className="p-6 space-y-3" style={{ borderColor: `${color}40` }}>
        <div className="flex items-center gap-3">
          <span
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ backgroundColor: color }}
          >
            {project.name[0]?.toUpperCase()}
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold leading-tight">{project.name}</h1>
            {project.description ? <p className="text-sm text-text-muted dark:text-dark-text-muted mt-1">{project.description}</p> : null}
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <SectionLabel>TASKS ({tasks.length})</SectionLabel>
          <CreateTaskButton projects={allProjects} />
        </div>
        <TaskList
          tasks={tasks.filter((t) => !t.completed)}
          projects={allProjects}
          emptyTitle="No tasks in this project"
          emptySubtitle="Create a task and assign it to this project."
        />
        {tasks.some((t) => t.completed) ? (
          <>
            <div className="pt-3">
              <SectionLabel>COMPLETED</SectionLabel>
            </div>
            <TaskList
              tasks={tasks.filter((t) => t.completed)}
              projects={allProjects}
              emptyTitle=""
              emptySubtitle=""
            />
          </>
        ) : null}
      </Card>

      {notes.length > 0 ? (
        <Card className="p-5 space-y-4">
          <SectionLabel>NOTES ({notes.length})</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} project={project} />
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
