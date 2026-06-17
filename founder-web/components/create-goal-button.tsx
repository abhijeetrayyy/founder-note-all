"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createGoal } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

export function CreateGoalButton() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>New goal</Button>
      <CreateGoalSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function CreateGoalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.currentTarget);
    const result = await createGoal(form);
    setPending(false);
    if (result.error) {
      toast.show(result.error, "error");
      return;
    }
    toast.show("Goal created", "success");
    onClose();
    router.refresh();
  }

  return (
    <Sheet open={open} onClose={onClose} title="New goal" size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input name="title" placeholder="Goal title" required autoFocus />
        <Textarea name="description" placeholder="Why is this goal important?" rows={3} />
        <Input name="target_date" type="date" label="Target date" />
        <Button type="submit" className="w-full h-12" disabled={pending}>
          {pending ? "Saving…" : "Create goal"}
        </Button>
      </form>
    </Sheet>
  );
}
