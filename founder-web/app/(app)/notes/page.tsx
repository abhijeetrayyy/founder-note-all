import { getNotes, getProjects } from "@/lib/data";
import { NoteCard } from "@/components/note-card";
import { CreateNoteButton } from "@/components/create-note-button";

export default async function NotesPage() {
  const [notes, projects] = await Promise.all([getNotes(), getProjects()]);
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight font-display">Notes</h1>
          <p className="text-sm text-foreground-muted">{notes.length} thought{notes.length !== 1 ? 's' : ''} captured</p>
        </div>
        <CreateNoteButton projects={projects} />
      </header>

      {notes.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} project={note.project_id ? projectMap.get(note.project_id) : undefined} />
          ))}
        </div>
      ) : (
        <div className="rounded-card glass-focused p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent-muted flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">No notes yet</h3>
          <p className="text-sm text-foreground-muted max-w-xs mx-auto">Ideas, meeting notes, links — capture them for safekeeping.</p>
        </div>
      )}
    </div>
  );
}
