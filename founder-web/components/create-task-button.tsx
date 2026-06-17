"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createTask } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import type { Project } from "@/lib/supabase/types";

export function CreateTaskButton({ projects }: { projects: Project[] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>New task</Button>
      <CreateTaskSheet open={open} onClose={() => setOpen(false)} projects={projects} />
    </>
  );
}

function CreateTaskSheet({ open, onClose, projects }: { open: boolean; onClose: () => void; projects: Project[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.currentTarget);
    const result = await createTask(form);
    setPending(false);
    if (result.error) {
      toast.show(result.error, "error");
      return;
    }
    toast.show("Task created", "success");
    onClose();
    router.refresh();
  }

  return (
    <Sheet open={open} onClose={onClose} title="New task" size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input name="title" placeholder="Task title" required autoFocus />
        <Input name="description" placeholder="Description (optional)" />
        <div className="grid grid-cols-2 gap-3">
          <Select name="priority" label="Priority">
            <option value={1}>Medium</option>
            <option value={2}>High</option>
            <option value={0}>Low</option>
          </Select>
          <Select name="energy_level" label="Energy">
            <option value={1}>Medium</option>
            <option value={2}>Deep</option>
            <option value={0}>Admin</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input name="due_date" type="date" label="Due date" />
          <Input name="estimated_minutes" type="number" placeholder="Minutes" label="Estimate" />
        </div>
        <Select name="project_id" label="Project">
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Input name="first_step" placeholder="First step" label="First step" />
        <Input name="implementation_intention" placeholder="I will [ACTION] at [TIME] in [PLACE]" label="Implementation intention" />
        <Button type="submit" className="w-full h-12" disabled={pending}>
          {pending ? "Saving…" : "Create task"}
        </Button>
      </form>
    </Sheet>
  );
}
