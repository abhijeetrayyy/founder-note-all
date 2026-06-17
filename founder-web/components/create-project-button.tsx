"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

export function CreateProjectButton() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>New project</Button>
      <CreateProjectSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function CreateProjectSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.currentTarget);
    const result = await createProject(form);
    setPending(false);
    if (result.error) {
      toast.show(result.error, "error");
      return;
    }
    toast.show("Project created", "success");
    onClose();
    router.refresh();
  }

  return (
    <Sheet open={open} onClose={onClose} title="New project" size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input name="name" placeholder="Project name" required autoFocus />
        <Textarea name="description" placeholder="What is this project about?" rows={3} />
        <Button type="submit" className="w-full h-12" disabled={pending}>
          {pending ? "Saving…" : "Create project"}
        </Button>
      </form>
    </Sheet>
  );
}
