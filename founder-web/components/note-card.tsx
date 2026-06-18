"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Note, Project } from "@/lib/supabase/types";

export function NoteCard({ note, project }: { note: Note; project?: Project }) {
  return (
    <Link
      href={`/notes/${note.id}`}
      className={cn("block p-4 rounded-2xl border transition hover:shadow-card bg-surface dark:bg-dark-surface border-border dark:border-dark-border", note.is_pinned && "border-primary/40")}
    >
      <h3 className="font-bold text-[15px] line-clamp-2">{note.title || "Untitled"}</h3>
      {note.content ? <p className="mt-1.5 text-sm text-text-muted dark:text-dark-text-muted line-clamp-3">{note.content}</p> : null}
      <div className="mt-3 flex items-center gap-2 text-xs text-text-muted dark:text-dark-text-muted">
        {note.is_pinned ? <span className="text-primary font-bold">Pinned</span> : null}
        <span>{note.category}</span>
        {project ? <span>· {project.name}</span> : null}
      </div>
    </Link>
  );
}
