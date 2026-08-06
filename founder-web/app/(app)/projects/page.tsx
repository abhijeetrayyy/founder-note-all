import Link from "next/link";
import { getProjects } from "@/lib/data";
import { CreateProjectButton } from "@/components/create-project-button";
import { PROJECT_COLORS } from "@/lib/constants";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight font-display">Projects</h1>
          <p className="text-sm text-foreground-muted">{projects.length} active</p>
        </div>
        <CreateProjectButton />
      </header>

      {projects.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}
              className="group p-5 rounded-card glass-ambient hover:glass-focused transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0 shadow-md"
                  style={{ backgroundColor: PROJECT_COLORS[project.color % PROJECT_COLORS.length] }}>
                  {project.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[15px] text-foreground truncate group-hover:text-accent transition-colors">{project.name}</h3>
                  {project.description && <p className="text-xs text-foreground-muted line-clamp-1 mt-0.5">{project.description}</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-card glass-focused p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent-muted flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">No projects yet</h3>
          <p className="text-sm text-foreground-muted max-w-xs mx-auto">Group tasks and notes around outcomes you&apos;re driving toward.</p>
        </div>
      )}
    </div>
  );
}
