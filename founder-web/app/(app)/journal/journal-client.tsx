"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useToast } from "@/components/ui/toast";
import { updateJournalEntry, deleteJournalEntry } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { moodEmoji, type JournalEntry } from "@/lib/supabase/types";

const moods = [
  { value: 0, emoji: "😊", label: "Productive" },
  { value: 1, emoji: "😐", label: "Neutral" },
  { value: 2, emoji: "🤔", label: "Thoughtful" },
  { value: 3, emoji: "😤", label: "Stressed" },
  { value: 4, emoji: "😴", label: "Tired" },
];

export function JournalClient({ entry }: { entry: JournalEntry }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = React.useState(false);
  const [content, setContent] = React.useState(entry.content);
  const [mood, setMood] = React.useState(entry.mood);
  const [pending, setPending] = React.useState(false);

  async function onSave() {
    setPending(true);
    const form = new FormData();
    form.set("id", entry.id);
    form.set("content", content);
    form.set("mood", String(mood));
    const result = await updateJournalEntry(form);
    setPending(false);
    if (result.error) toast.show(result.error, "error");
    else {
      setEditing(false);
      toast.show("Entry updated", "success");
      router.refresh();
    }
  }

  async function onDelete() {
    if (!confirm("Delete this journal entry?")) return;
    const result = await deleteJournalEntry(entry.id);
    if (result.error) toast.show(result.error, "error");
    else {
      toast.show("Entry deleted", "success");
      router.refresh();
    }
  }

  return (
    <div className="p-4 rounded-card glass-ambient">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-extrabold text-foreground-muted">{format(new Date(entry.entry_date), "MMM d, yyyy")}</span>
        <div className="flex items-center gap-2">
          {editing ? (
            <div className="flex gap-1">
              {moods.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  aria-pressed={mood === m.value}
                  className={cn("w-7 h-7 rounded-full text-sm flex items-center justify-center transition-all focus-ring", mood === m.value ? "bg-accent-muted-strong ring-2 ring-accent" : "hover:bg-base-raised")}
                  title={m.label}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-lg">{moodEmoji(entry.mood as 0 | 1 | 2 | 3 | 4)}</span>
          )}
          <button
            onClick={() => {
              if (editing) onSave();
              else { setEditing(true); setContent(entry.content); setMood(entry.mood); }
            }}
            disabled={pending}
            className="text-xs font-bold text-accent hover:underline focus-ring"
          >
            {editing ? (pending ? "Saving…" : "Save") : "Edit"}
          </button>
          {editing && (
            <button onClick={() => setEditing(false)} className="text-xs font-bold text-foreground-muted hover:underline focus-ring">Cancel</button>
          )}
          <button onClick={onDelete} className="text-xs font-bold text-state-overdue hover:underline focus-ring">Delete</button>
        </div>
      </div>
      {editing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-xl bg-base-raised border-0 px-4 py-3 text-[15px] text-foreground outline-none focus:ring-2 focus:ring-accent/40 resize-y"
          rows={4}
        />
      ) : (
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground">{entry.content}</p>
      )}
    </div>
  );
}
