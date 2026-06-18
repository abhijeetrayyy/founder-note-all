import Link from "next/link";
import { getProjects } from "@/lib/data";
import { Card, SectionLabel } from "@/components/ui/card";
import { CreateProjectButton } from "@/components/create-project-button";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Projects</h1>
          <p className="text-text-muted dark:text-dark-text-muted mt-1">Organize work around outcomes.</p>
        </div>
        <CreateProjectButton />
      </header>

      <Card className="p-5">
        <SectionLabel className="mb-4">ACTIVE PROJECTS ({projects.length})</SectionLabel>
        {projects.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="p-4 rounded-2xl border bg-surface dark:bg-dark-surface border-border dark:border-dark-border hover:shadow-card transition"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0"
                    style={{ backgroundColor: ["#5B4FE9", "#14B8A6", "#F59E0B", "#EF4444", "#7C3AED", "#3B82F6"][project.color % 6] }}
                  >
                    {project.name[0]}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[15px] truncate">{project.name}</h3>
                    {project.description ? <p className="text-sm text-text-muted dark:text-dark-text-muted line-clamp-1">{project.description}</p> : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted dark:text-dark-text-muted">No projects yet. Create one to group tasks and notes.</p>
        )}
      </Card>
    </div>
  );
}
