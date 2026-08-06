"use client";

import Link from "next/link";
import type { Note, Project } from "@/lib/supabase/types";

export function NoteCard({ note, project }: { note: Note; project?: Project }) {
  return (
    <Link
      href={`/notes/${note.id}`}
      className="group block p-5 rounded-card glass-ambient hover:glass-active transition-all duration-300"
    >
      <div className="flex items-start gap-2 mb-2">
        {note.is_pinned && <span className="text-2xs text-accent font-bold">📌</span>}
        <span className="text-2xs text-foreground-subtle font-semibold uppercase tracking-wider">{note.category}</span>
      </div>
      <h3 className="font-bold text-[15px] text-foreground line-clamp-2 mb-1.5">{note.title || "Untitled"}</h3>
      {note.content ? <p className="text-sm text-foreground-muted line-clamp-3 leading-relaxed">{note.content}</p> : null}
      {project && <p className="mt-3 text-xs text-foreground-subtle font-medium">{project.name}</p>}
    </Link>
  );
}
