import Link from "next/link";
import { notFound } from "next/navigation";
import { getNote, getProjects } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { Card, SectionLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NoteActions } from "./note-actions";

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = await getNote(id);
  if (!note) notFound();

  const projects = await getProjects();
  const project = note.project_id ? projects.find((p) => p.id === note.project_id) : null;

  const supabase = await createClient();
  const { data: noteTags } = await supabase.from("note_tags").select("tag_id").eq("note_id", id);
  const tagIds = (noteTags ?? []).map((t) => t.tag_id);
  const { data: tagsData } = tagIds.length
    ? await supabase.from("tags").select("*").in("id", tagIds)
    : { data: [] };
  const tags = (tagsData ?? []) as { id: string; name: string; color: number }[];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/notes" className="text-sm font-bold text-text-muted dark:text-dark-text-muted hover:text-primary">
          ← Back to notes
        </Link>
        <NoteActions noteId={note.id} isPinned={note.is_pinned} isArchived={note.is_archived} />
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          {note.is_pinned ? <span className="text-xs font-extrabold text-primary">PINNED</span> : null}
          <span className="text-xs font-bold text-text-muted dark:text-dark-text-muted uppercase tracking-wider">{note.category}</span>
          {project ? <span className="text-xs font-bold text-text-muted dark:text-dark-text-muted">· {project.name}</span> : null}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">{note.title || "Untitled"}</h1>
        {tags.length ? (
          <div className="flex items-center gap-2 flex-wrap">
            {tags.map((t) => (
              <span key={t.id} className="text-xs font-bold px-2.5 h-6 rounded-full inline-flex items-center" style={{ backgroundColor: `#${t.color.toString(16).padStart(6, "0")}20`, color: `#${t.color.toString(16).padStart(6, "0")}` }}>
                #{t.name}
              </span>
            ))}
          </div>
        ) : null}
        <div className="border-t border-border dark:border-dark-border pt-4">
          {note.content ? (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{note.content}</p>
          ) : (
            <p className="text-sm text-text-muted dark:text-dark-text-muted italic">No content yet.</p>
          )}
        </div>
        <div className="text-xs text-text-muted dark:text-dark-text-muted pt-2">
          Created {new Date(note.created_at).toLocaleString()} · Updated {new Date(note.updated_at).toLocaleString()}
        </div>
      </Card>
    </div>
  );
}
