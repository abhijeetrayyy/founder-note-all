"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createNote } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import type { Project } from "@/lib/supabase/types";

export function CreateNoteButton({ projects }: { projects: Project[] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>New note</Button>
      <CreateNoteSheet open={open} onClose={() => setOpen(false)} projects={projects} />
    </>
  );
}

function CreateNoteSheet({ open, onClose, projects }: { open: boolean; onClose: () => void; projects: Project[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.currentTarget);
    const result = await createNote(form);
    setPending(false);
    if (result.error) {
      toast.show(result.error, "error");
      return;
    }
    toast.show("Note created", "success");
    onClose();
    router.refresh();
  }

  return (
    <Sheet open={open} onClose={onClose} title="New note" size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input name="title" placeholder="Note title" required autoFocus />
        <Select name="category" label="Category">
          <option value="General">General</option>
          <option value="Idea">Idea</option>
          <option value="Meeting">Meeting</option>
          <option value="Research">Research</option>
        </Select>
        <Select name="project_id" label="Project">
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Textarea name="content" placeholder="Write your note…" rows={6} />
        <Button type="submit" className="w-full h-12" disabled={pending}>
          {pending ? "Saving…" : "Create note"}
        </Button>
      </form>
    </Sheet>
  );
}
