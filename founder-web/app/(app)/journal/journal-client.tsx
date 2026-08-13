"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useToast } from "@/components/ui/toast";
import { updateJournalEntry, deleteJournalEntry, createJournalEntry } from "@/lib/actions";
import { parseDecision, KNEW, UNDO, DECIDED } from "@/lib/journal";
import { cn } from "@/lib/utils";
import { moodEmoji, type JournalEntry } from "@/lib/supabase/types";
import { MOODS } from "@/lib/constants";

/**
 * One entry.
 *
 * A decision renders as its three parts, because the shape is the information —
 * flattened into a paragraph, "what would change my mind" reads as an
 * afterthought instead of the clause the whole entry exists for.
 */
export function JournalClient({ entry }: { entry: JournalEntry }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = React.useState(false);
  const [content, setContent] = React.useState(entry.content);
  const [mood, setMood] = React.useState(entry.mood);
  const [pending, setPending] = React.useState(false);

  const decision = parseDecision(entry.content);
  const when = format(new Date(entry.entry_date), "d MMM yyyy");

  async function onSave() {
    setPending(true);
    const form = new FormData();
    form.set("id", entry.id);
    form.set("content", content);
    form.set("mood", String(mood));
    const result = await updateJournalEntry(form);
    setPending(false);
    if (result.error) { toast.show(result.error, "error"); return; }
    setEditing(false);
    router.refresh();
  }

  /**
   * Deleting is a real delete, so it is offered with the entry itself held in
   * the toast — click Undo and it is written back. A `confirm()` dialog asks
   * you to be careful; this lets you be wrong.
   */
  async function onDelete() {
    const snapshot = { content: entry.content, mood: entry.mood, entry_date: entry.entry_date };
    const result = await deleteJournalEntry(entry.id);
    if (result.error) { toast.show(result.error, "error"); return; }
    toast.show("Entry deleted", "success", {
      label: "Undo",
      onClick: async () => {
        const form = new FormData();
        form.set("content", snapshot.content);
        form.set("mood", String(snapshot.mood));
        form.set("entry_date", snapshot.entry_date);
        await createJournalEntry(form);
        router.refresh();
      },
    });
    router.refresh();
  }

  return (
    <article className="rounded-[8px] border border-[#26262B] bg-[#141417] p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-2xs text-[#9C9CA4]">{when}</span>
          {decision
            ? <span className="font-mono text-2xs tracking-[0.12em] uppercase text-[#7FA6D9]">Decision</span>
            : <span className="text-base leading-none" title={MOODS[entry.mood]?.label}>{moodEmoji(entry.mood as 0 | 1 | 2 | 3 | 4)}</span>}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { if (editing) onSave(); else { setEditing(true); setContent(entry.content); setMood(entry.mood); } }}
            disabled={pending} className="text-xs text-[#F0F0EE] hover:underline underline-offset-2 focus-ring rounded">
            {editing ? (pending ? "Saving…" : "Save") : "Edit"}
          </button>
          {editing && (
            <button onClick={() => setEditing(false)} className="text-xs text-[#9C9CA4] hover:underline focus-ring rounded">Cancel</button>
          )}
          <button onClick={onDelete} className="text-xs text-[#9C9CA4] hover:text-[#FF8A4C] focus-ring rounded transition-colors">Delete</button>
        </div>
      </div>

      {editing ? (
        <>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6}
            className="mt-3.5 w-full px-3.5 py-2.5 rounded-[6px] bg-[#1B1B1F] border border-[#26262B] text-base text-[#F0F0EE] outline-none focus:border-[#35353C] resize-y leading-[1.5]" />
          <p className="mt-2 font-mono text-2xs text-[#9C9CA4]">
            Lines beginning {DECIDED} {KNEW} {UNDO} keep this filed as a decision.
          </p>
          {!decision && (
            <div className="flex flex-wrap gap-2 mt-3">
              {MOODS.map((m) => (
                <button key={m.value} onClick={() => setMood(m.value)} aria-pressed={mood === m.value}
                  className={cn("h-8 px-2.5 rounded-[6px] text-xs border transition-colors focus-ring",
                    mood === m.value ? "bg-[#F0F0EE] text-[#0B0B0D] border-[#F0F0EE]" : "border-[#26262B] bg-[#1B1B1F] text-[#9C9CA4]")}>
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          )}
        </>
      ) : decision ? (
        <div className="mt-3.5 flex flex-col gap-3.5">
          <p className="text-lg leading-[1.4]">{decision.decided}</p>
          {decision.knew && (
            <div>
              <p className="label-mono">What I knew</p>
              <p className="mt-1 text-base text-[#9C9CA4] leading-[1.55] whitespace-pre-wrap">{decision.knew}</p>
            </div>
          )}
          {decision.changesMyMind ? (
            <div className="p-3.5 rounded-[6px] bg-[#1B1B1F] border border-[#26262B]">
              <p className="label-mono">What would change my mind</p>
              <p className="mt-1 text-base leading-[1.55] whitespace-pre-wrap">{decision.changesMyMind}</p>
            </div>
          ) : (
            <p className="text-xs text-[#9C9CA4]">
              No falsification condition written. Edit this and add one while you still remember the reasoning.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3.5 text-base leading-[1.6] whitespace-pre-wrap text-[#F0F0EE]">{entry.content}</p>
      )}
    </article>
  );
}
