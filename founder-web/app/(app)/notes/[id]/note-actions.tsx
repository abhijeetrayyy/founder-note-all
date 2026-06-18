"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { pinNote, archiveNote, deleteNote } from "@/lib/actions";

export function NoteActions({ noteId, isPinned, isArchived }: { noteId: string; isPinned: boolean; isArchived: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState(false);

  async function onPin() {
    setPending(true);
    const result = await pinNote(noteId, !isPinned);
    setPending(false);
    if (result.error) toast.show(result.error, "error");
    else router.refresh();
  }

  async function onArchive() {
    setPending(true);
    const result = await archiveNote(noteId, !isArchived);
    setPending(false);
    if (result.error) toast.show(result.error, "error");
    else {
      toast.show(isArchived ? "Note restored" : "Note archived", "success");
      router.push("/notes");
      router.refresh();
    }
  }

  async function onDelete() {
    if (!confirm("Delete this note? This cannot be undone.")) return;
    setPending(true);
    const result = await deleteNoteAction(noteId);
    setPending(false);
    if (result.error) toast.show(result.error, "error");
    else {
      toast.show("Note deleted", "success");
      router.push("/notes");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPin}
        disabled={pending}
        className="h-9 px-3 rounded-xl hover:bg-surface-alt dark:hover:bg-dark-surface-alt text-sm font-bold focus-ring disabled:opacity-50"
        aria-label={isPinned ? "Unpin" : "Pin"}
      >
        {isPinned ? "Unpin" : "Pin"}
      </button>
      <button
        onClick={onArchive}
        disabled={pending}
        className="h-9 px-3 rounded-xl hover:bg-surface-alt dark:hover:bg-dark-surface-alt text-sm font-bold focus-ring disabled:opacity-50"
      >
        {isArchived ? "Restore" : "Archive"}
      </button>
      <button
        onClick={onDelete}
        disabled={pending}
        className="h-9 px-3 rounded-xl hover:bg-danger/10 text-danger text-sm font-bold focus-ring disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}

async function deleteNoteAction(id: string) {
  return deleteNote(id);
}
