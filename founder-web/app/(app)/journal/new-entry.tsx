"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { createJournalEntry } from "@/lib/actions";
import { formatDecision } from "@/lib/journal";
import { MOODS } from "@/lib/constants";

/**
 * Writing something down.
 *
 * The decision form is three prompts rather than a blank box, because a blank
 * box is where journalling goes to die — and because the prompts are the value.
 * "What would change my mind" is a question almost nobody asks themselves in
 * the moment, and it is the only field that makes the entry worth rereading.
 */
export function NewEntry() {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = React.useState<"decision" | "day" | null>(null);
  const [pending, setPending] = React.useState(false);

  const [decided, setDecided] = React.useState("");
  const [knew, setKnew] = React.useState("");
  const [undo, setUndo] = React.useState("");
  const [note, setNote] = React.useState("");
  const [mood, setMood] = React.useState(1);

  async function save() {
    const content = mode === "decision"
      ? formatDecision({ decided, knew, changesMyMind: undo })
      : note.trim();
    if (!content || (mode === "decision" && !decided.trim())) {
      toast.show(mode === "decision" ? "What did you decide?" : "Nothing to save", "error");
      return;
    }
    setPending(true);
    const form = new FormData();
    form.set("content", content);
    form.set("mood", String(mode === "decision" ? 1 : mood));
    const r = await createJournalEntry(form);
    setPending(false);
    if (r.error) { toast.show(r.error, "error"); return; }
    setDecided(""); setKnew(""); setUndo(""); setNote(""); setMode(null);
    router.refresh();
  }

  if (!mode) {
    return (
      <div className="flex gap-2.5 flex-wrap">
        <button onClick={() => setMode("decision")}
          className="h-11 px-[18px] rounded-[6px] bg-[#F0F0EE] hover:bg-[#FFFFFF] text-[#0B0B0D] text-base font-medium transition-colors focus-ring">
          Log a decision
        </button>
        <button onClick={() => setMode("day")}
          className="h-11 px-4 rounded-[6px] border border-[#35353C] text-[#F0F0EE] text-base hover:bg-[#17171B] transition-colors focus-ring">
          Just write something
        </button>
      </div>
    );
  }

  return (
    <section className="rounded-[8px] border border-[#35353C] bg-[#141417] p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-base font-semibold">
          {mode === "decision" ? "A call you just made" : "Today"}
        </h2>
        <button onClick={() => setMode(null)} className="text-xs text-[#9C9CA4] hover:text-[#F0F0EE] focus-ring rounded px-1">
          Cancel
        </button>
      </div>

      {mode === "decision" ? (
        <div className="flex flex-col gap-3.5 mt-4">
          <Field label="What did you decide?" value={decided} onChange={setDecided} autoFocus
            placeholder="Shipping pricing v2 without an annual tier" />
          <Field label="What did you know when you decided?" value={knew} onChange={setKnew} rows={3}
            placeholder="Four of ten trials asked about annual. No conversion data either way. Two weeks of runway pressure." />
          <Field label="What would change your mind?" value={undo} onChange={setUndo} rows={2}
            placeholder="Three or more deals stalling specifically on annual billing." />
          <p className="text-xs text-[#9C9CA4] leading-[1.55] max-w-[62ch]">
            That last one is the whole point. Without it, in six months you will only remember whether
            it worked — which tells you nothing about whether it was a good call.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5 mt-4">
          <Field label="How did it go?" value={note} onChange={setNote} rows={5} autoFocus
            placeholder="Anything. Two sentences count." />
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button key={m.value} onClick={() => setMood(m.value)} aria-pressed={mood === m.value}
                className={cn("h-9 px-3 rounded-[6px] text-sm border transition-colors focus-ring",
                  mood === m.value
                    ? "bg-[#F0F0EE] text-[#0B0B0D] border-[#F0F0EE] font-medium"
                    : "border-[#26262B] bg-[#1B1B1F] text-[#9C9CA4] hover:text-[#F0F0EE]")}>
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={save} disabled={pending}
        className="mt-4 h-11 px-[18px] rounded-[6px] bg-[#F0F0EE] hover:bg-[#FFFFFF] text-[#0B0B0D] text-base font-medium disabled:opacity-40 transition-colors focus-ring">
        {pending ? "Saving…" : mode === "decision" ? "Log it" : "Save"}
      </button>
    </section>
  );
}

function Field({ label, value, onChange, placeholder, rows = 1, autoFocus }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; autoFocus?: boolean;
}) {
  const id = React.useId();
  const shared = "w-full px-3.5 py-2.5 rounded-[6px] bg-[#1B1B1F] border border-[#26262B] text-base text-[#F0F0EE] placeholder:text-[#6E6E77] outline-none focus:border-[#35353C]";
  return (
    <div>
      <label htmlFor={id} className="label-mono block mb-1.5">{label}</label>
      {rows > 1 ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
          placeholder={placeholder} autoFocus={autoFocus} className={cn(shared, "resize-y leading-[1.5]")} />
      ) : (
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} autoFocus={autoFocus} className={shared} />
      )}
    </div>
  );
}
