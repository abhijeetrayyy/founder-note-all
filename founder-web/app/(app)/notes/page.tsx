import { getNotes, getProjects } from "@/lib/data";
import { Card, SectionLabel } from "@/components/ui/card";
import { NoteCard } from "@/components/note-card";
import { CreateNoteButton } from "@/components/create-note-button";

export default async function NotesPage() {
  const [notes, projects] = await Promise.all([getNotes(), getProjects()]);
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Notes</h1>
          <p className="text-text-muted dark:text-dark-text-muted mt-1">Capture ideas, meeting notes, and knowledge.</p>
        </div>
        <CreateNoteButton projects={projects} />
      </header>

      <Card className="p-5">
        <SectionLabel className="mb-4">ALL NOTES ({notes.length})</SectionLabel>
        {notes.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} project={note.project_id ? projectMap.get(note.project_id) : undefined} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted dark:text-dark-text-muted">No notes yet. Create your first note.</p>
        )}
      </Card>
    </div>
  );
}
