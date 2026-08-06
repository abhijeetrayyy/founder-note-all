"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { parseSmartInput } from "@/lib/smart-input";
import { quickCapture } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";

const ENERGY_LABELS = ["Admin", "Medium", "Deep"] as const;
const PRIORITY_LABELS = ["Low", "Medium", "High"] as const;
const RECURRENCE_LABELS = ["", "Daily", "Weekly", "Monthly"] as const;

function fmtDate(d: Date) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(d); target.setHours(0,0,0,0);
  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === today.getTime() + 86400000) return "Tomorrow";
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export function InlineCapture() {
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const router = useRouter(); const toast = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const parsed = React.useMemo(() => (text.trim() ? parseSmartInput(text) : null), [text]);

  const chips: { label: string; color: string }[] = [];
  if (parsed) {
    if (parsed.date) chips.push({ label: fmtDate(parsed.date), color: "border-blue-400/30 text-blue-300" });
    if (parsed.time) chips.push({ label: parsed.time.label, color: "border-blue-400/30 text-blue-300" });
    if (parsed.energy != null) chips.push({ label: ENERGY_LABELS[parsed.energy], color: parsed.energy === 2 ? "border-purple-400/30 text-purple-300" : parsed.energy === 1 ? "border-blue-400/30 text-blue-300" : "border-emerald-400/30 text-emerald-300" });
    if (parsed.priority != null && parsed.priority > 0) chips.push({ label: PRIORITY_LABELS[parsed.priority], color: "border-amber-400/30 text-amber-300" });
    if (parsed.recurrence != null && parsed.recurrence > 0) chips.push({ label: RECURRENCE_LABELS[parsed.recurrence], color: "border-orange-400/30 text-orange-300" });
    if (parsed.projectHint) chips.push({ label: `@${parsed.projectHint}`, color: "border-pink-400/30 text-pink-300" });
    if (parsed.tags.length) parsed.tags.forEach(t => chips.push({ label: `#${t}`, color: "border-sky-400/30 text-sky-300" }));
  }

  async function submit() {
    if (!text.trim() || busy) return;
    setBusy(true);
    const f = new FormData(); f.set("text", text); f.set("type", "auto");
    const r = await quickCapture(f);
    setBusy(false);
    if (r.error) { toast.show(r.error, "error"); return; }
    toast.show("Captured", "success");
    setText(""); setShowPreview(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => { setText(e.target.value); setShowPreview(true); }}
          onFocus={() => text.trim() && setShowPreview(true)}
          onBlur={() => setTimeout(() => setShowPreview(false), 200)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="What's on your mind? Type naturally — we'll figure out the details."
          className="w-full h-14 rounded-2xl bg-base-raised border-0 px-5 text-[16px] font-medium text-foreground placeholder:text-foreground-subtle outline-none focus:ring-2 focus:ring-accent/30 transition-all"
        />
        <button
          onClick={submit}
          disabled={!text.trim() || busy}
          className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-accent-600 text-white flex items-center justify-center disabled:opacity-30 transition-all hover:bg-accent-500 focus-ring"
          aria-label="Capture"
        >
          {busy ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          )}
        </button>
      </div>

      {showPreview && parsed && (
        <div className="mt-3 p-4 rounded-2xl glass-ambient border border-base-border animate-scale-in">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xs uppercase tracking-wider text-foreground-subtle font-bold">{parsed.isTask ? "TASK" : "NOTE"}</span>
            {parsed.isMIT && <span className="text-2xs font-bold text-accent bg-accent-muted px-2 py-0.5 rounded-full">MIT</span>}
          </div>
          <p className="text-sm font-semibold text-foreground mb-2">{parsed.cleanedTitle || "..."}</p>
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {chips.map((c, i) => (
                <span key={i} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${c.color}`}>{c.label}</span>
              ))}
            </div>
          )}
          {!chips.length && !parsed.cleanedTitle && (
            <p className="text-xs text-foreground-muted">Add a date, time, energy, or project to see details.</p>
          )}
        </div>
      )}
    </div>
  );
}
