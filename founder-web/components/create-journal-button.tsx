"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createJournalEntry } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

const moods = [
  { value: 0, label: "Productive 😊" },
  { value: 1, label: "Neutral 😐" },
  { value: 2, label: "Thoughtful 🤔" },
  { value: 3, label: "Stressed 😤" },
  { value: 4, label: "Tired 😴" },
];

export function CreateJournalButton() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>New entry</Button>
      <CreateJournalSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function CreateJournalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.currentTarget);
    const result = await createJournalEntry(form);
    setPending(false);
    if (result.error) {
      toast.show(result.error, "error");
      return;
    }
    toast.show("Journal entry saved", "success");
    onClose();
    router.refresh();
  }

  return (
    <Sheet open={open} onClose={onClose} title="New journal entry" size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <Select name="mood" label="Mood">
          {moods.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
        <Textarea name="content" placeholder="What's on your mind?" rows={8} required autoFocus />
        <Button type="submit" className="w-full h-12" disabled={pending}>
          {pending ? "Saving…" : "Save entry"}
        </Button>
      </form>
    </Sheet>
  );
}
