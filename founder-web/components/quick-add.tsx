"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { parseSmartInput, summary } from "@/lib/smart-input";
import { quickCapture } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Mode = "auto" | "task" | "note" | "mit";

export function QuickAdd({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = React.useState(""); const [mode, setMode] = React.useState<Mode>("auto"); const [busy, setBusy] = React.useState(false);
  const router = useRouter(); const toast = useToast(); const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { if (open) { setText(""); setMode("auto"); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);

  const parsed = React.useMemo(() => parseSmartInput(text), [text]);
  const hint = text.trim() ? summary(parsed) : "Type naturally. We'll figure out the details.";

  async function submit(e?: React.FormEvent) { e?.preventDefault(); if (!text.trim() || busy) return; setBusy(true); const f = new FormData(); f.set("text", text); f.set("type", mode); const r = await quickCapture(f); setBusy(false); if (r.error) { toast.show(r.error, "error"); return; } toast.show(`${mode === "note" || r.type === "note" ? "Thought" : "Task"} captured`, "success"); setText(""); onClose(); router.refresh(); }

  return (
    <Sheet open={open} onClose={onClose} title="Capture" size="md">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex gap-2">
          {(["auto","task","note","mit"] as Mode[]).map((m) => {
            const labels: Record<Mode,string> = { auto: "Auto", task: "Task", note: "Note", mit: "MIT" };
            const active = mode === m;
            return <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={active} className={cn("h-9 px-3.5 rounded-full text-sm font-semibold transition focus-ring", active ? "bg-accent-600 text-white" : "bg-base-raised text-foreground-muted hover:bg-base-overlay")}>{labels[m]}</button>;
          })}
        </div>
        <div className="relative">
          <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) submit(); }}
            placeholder={mode === "note" ? "Jot down a thought…" : "What's on your mind?"}
            className="w-full h-14 rounded-2xl bg-base-raised border-0 px-4 text-[17px] font-medium text-foreground placeholder:text-foreground-subtle outline-none focus:ring-2 focus:ring-accent/30 transition" />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-foreground-muted font-medium">{hint}</span>
          <span className="text-foreground-subtle hidden sm:inline">↵ Enter · Esc close</span>
        </div>
        <button type="submit" disabled={!text.trim() || busy} className="w-full h-12 rounded-2xl text-white font-bold text-[15px] bg-gradient-to-br from-accent-600 to-accent-700 hover:shadow-lg transition disabled:opacity-50 focus-ring">
          {busy ? "Capturing…" : mode === "note" ? "Save thought" : mode === "mit" ? "Save as priority" : "Capture"}
        </button>
      </form>
    </Sheet>
  );
}
