"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { quickCapture } from "@/lib/actions";

/**
 * Turn a line of a note into a loop.
 *
 * Notes are where the half-formed version of most tasks lives, and until now
 * there was no path from there into the system — you had to read the note,
 * remember the thing, and retype it somewhere else. Select any text in the note
 * and this offers to capture it.
 */
export function ExtractLoop({ noteTitle }: { noteTitle: string }) {
  const router = useRouter();
  const toast = useToast();
  const [selection, setSelection] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    function onSelect() {
      const text = window.getSelection()?.toString().trim() ?? "";
      // Long enough to be a thought, short enough to be one loop.
      setSelection(text.length >= 4 && text.length <= 200 ? text : "");
    }
    document.addEventListener("selectionchange", onSelect);
    return () => document.removeEventListener("selectionchange", onSelect);
  }, []);

  async function extract() {
    if (!selection || busy) return;
    setBusy(true);
    const f = new FormData();
    f.set("text", selection);
    f.set("type", "task");
    const r = await quickCapture(f);
    setBusy(false);
    if (r.error) { toast.show(r.error, "error"); return; }
    toast.show("Captured — it is in your inbox", "success");
    window.getSelection()?.removeAllRanges();
    setSelection("");
    router.refresh();
  }

  if (!selection) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#171512] text-[#FBF8F2] shadow-focused max-w-[min(90vw,32rem)]">
        <span className="text-[13px] text-[#B3AB9C] truncate flex-1" title={selection}>
          “{selection}”
        </span>
        <button
          onClick={extract}
          disabled={busy}
          className="flex-none h-8 px-3.5 rounded-lg bg-[#5B4FE9] hover:bg-[#6E63FF] text-white text-[12.5px] font-semibold transition-colors focus-ring disabled:opacity-50"
        >
          {busy ? "Capturing…" : "Make it a loop"}
        </button>
      </div>
      <p className="mt-1.5 text-center font-mono text-[10px] text-[#A69E90]">
        from “{noteTitle || "Untitled"}”
      </p>
    </div>
  );
}
