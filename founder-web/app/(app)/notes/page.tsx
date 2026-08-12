import { getNotes, getProjects } from "@/lib/data";
import { EmptyState } from "@/components/ui/card";
import { NoteCard } from "@/components/note-card";
import { CreateNoteButton } from "@/components/create-note-button";

export default async function NotesPage() {
  const [notes, projects] = await Promise.all([getNotes(), getProjects()]);
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-foreground-muted mt-1">{notes.length} thoughts captured</p>
        </div>
        <CreateNoteButton projects={projects} />
      </header>

      {notes.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} project={note.project_id ? projectMap.get(note.project_id) : undefined} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
          title="No notes yet"
          subtitle="Ideas, meeting notes, links — capture them all in one calm place."
        />
      )}
    </div>
  );
}
