import Link from "next/link";
import { notFound } from "next/navigation";
import { getNote, getProjects, getNoteTags } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NoteActions } from "./note-actions";
import { ExtractLoop } from "@/components/extract-loop";

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [note, projects, tags] = await Promise.all([getNote(id), getProjects(), getNoteTags(id)]);
  if (!note) notFound();
  const project = note.project_id ? projects.find((p) => p.id === note.project_id) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/notes" className="text-sm font-semibold text-foreground-muted hover:text-foreground transition-colors">← Notes</Link>
        <NoteActions noteId={note.id} isPinned={note.is_pinned} isArchived={note.is_archived} />
        <ExtractLoop noteTitle={note.title} />
      </div>

      <Card variant="focused" className="p-6 space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          {note.is_pinned && <Badge variant="tonal">Pinned</Badge>}
          <span className="text-2xs font-bold text-foreground-muted uppercase tracking-wider">{note.category}</span>
          {project && <span className="text-2xs text-foreground-subtle font-medium">{project.name}</span>}
        </div>

        <h1 className="text-2xl font-bold text-foreground leading-tight font-display">{note.title || "Untitled"}</h1>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t.id} className="text-xs font-semibold px-2.5 h-6 rounded-full flex items-center" style={{ background: `#${t.color.toString(16).padStart(6, "0")}20`, color: `#${t.color.toString(16).padStart(6, "0")}` }}>#{t.name}</span>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-base-border">
          {note.content ? <p className="text-sm text-foreground-muted leading-relaxed whitespace-pre-wrap">{note.content}</p> : <p className="text-sm text-foreground-subtle italic">No content yet.</p>}
        </div>

        <p className="text-xs text-foreground-subtle pt-1">Created {new Date(note.created_at).toLocaleDateString()} · Updated {new Date(note.updated_at).toLocaleDateString()}</p>
      </Card>
    </div>
  );
}
