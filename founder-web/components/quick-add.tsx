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
  const [text, setText] = React.useState("");
  const [mode, setMode] = React.useState<Mode>("auto");
  const [busy, setBusy] = React.useState(false);
  const router = useRouter();
  const toast = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setText("");
      setMode("auto");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const parsed = React.useMemo(() => parseSmartInput(text), [text]);
  const hint = text.trim() ? summary(parsed) : "Type naturally, e.g. Call investor tomorrow at 2pm #sales";

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    const form = new FormData();
    form.set("text", text);
    form.set("type", mode);
    const result = await quickCapture(form);
    setBusy(false);
    if (result.error) {
      toast.show(result.error, "error");
      return;
    }
    toast.show(`${mode === "note" || result.type === "note" ? "Note" : "Task"} created`, "success");
    setText("");
    onClose();
    router.refresh();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Quick Add" size="md">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex gap-2">
          <ModeButton mode="auto" current={mode} onClick={() => setMode("auto")} />
          <ModeButton mode="task" current={mode} onClick={() => setMode("task")} />
          <ModeButton mode="note" current={mode} onClick={() => setMode("note")} />
          <ModeButton mode="mit" current={mode} onClick={() => setMode("mit")} />
        </div>

        <div className="relative">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) submit();
            }}
            placeholder={mode === "note" ? "Write a note…" : "What needs to happen?"}
            className="w-full h-14 rounded-2xl bg-surface-alt dark:bg-dark-surface-alt border-0 px-4 text-[17px] font-medium outline-none focus:ring-2 focus:ring-primary/40 transition placeholder:text-text-muted dark:placeholder:text-dark-text-muted"
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted dark:text-dark-text-muted font-medium">{hint}</span>
          <span className="text-text-muted dark:text-dark-text-muted hidden sm:inline">Enter to save · Esc to close</span>
        </div>

        <button
          type="submit"
          disabled={!text.trim() || busy}
          className="w-full h-12 rounded-2xl bg-primary text-white font-bold text-[15px] shadow-primary hover:bg-primary-deep transition disabled:opacity-50 focus-ring"
        >
          {busy ? "Saving…" : mode === "note" ? "Save Note" : mode === "mit" ? "Save as MIT" : "Save Task"}
        </button>
      </form>
    </Sheet>
  );
}

function ModeButton({ mode, current, onClick }: { mode: Mode; current: Mode; onClick: () => void }) {
  const labels = { auto: "Auto", task: "Task", note: "Note", mit: "MIT" };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 px-3.5 rounded-pill text-sm font-bold transition focus-ring",
        current === mode ? "bg-primary text-white" : "bg-surface-alt dark:bg-dark-surface-alt text-text dark:text-dark-text hover:bg-surface dark:hover:bg-dark-surface",
      )}
    >
      {labels[mode]}
    </button>
  );
}
