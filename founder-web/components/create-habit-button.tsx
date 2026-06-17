"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createHabit } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

export function CreateHabitButton() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>New habit</Button>
      <CreateHabitSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function CreateHabitSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.currentTarget);
    const result = await createHabit(form);
    setPending(false);
    if (result.error) {
      toast.show(result.error, "error");
      return;
    }
    toast.show("Habit created", "success");
    onClose();
    router.refresh();
  }

  return (
    <Sheet open={open} onClose={onClose} title="New habit" size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input name="name" placeholder="Habit name" required autoFocus />
        <Textarea name="description" placeholder="When and where will you do this?" rows={3} />
        <Input name="target_per_day" type="number" min={1} placeholder="Target per day" label="Target per day" />
        <Button type="submit" className="w-full h-12" disabled={pending}>
          {pending ? "Saving…" : "Create habit"}
        </Button>
      </form>
    </Sheet>
  );
}
