"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { savePreferences } from "@/lib/actions";
import { DEFAULT_CAPACITY, type Prefs } from "@/lib/loops";

/**
 * Tuning, not configuration.
 *
 * Two things only, both of which the app currently asserts on the founder's
 * behalf: how much a day of theirs actually holds, and when the two rituals
 * belong. Everything else stays out.
 */
export function TuningForm({ prefs, observedDeep }: { prefs: Prefs; observedDeep: number | null }) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const r = await savePreferences(new FormData(e.currentTarget));
    setSaving(false);
    if (r.error) { toast.show(r.error, "error"); return; }
    toast.show("Saved", "success");
    router.refresh();
  }

  const lanes = [
    { name: "deep", label: "Deep", value: prefs.capacity.deep, hint: "Blocks that need real thinking" },
    { name: "medium", label: "Medium", value: prefs.capacity.medium, hint: "Calls, reviews, drafting" },
    { name: "admin", label: "Admin", value: prefs.capacity.admin, hint: "Small things with a clear end" },
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <p className="text-[13.5px] font-semibold">What a day of yours holds</p>
        <p className="mt-1 text-[12.5px] text-[#8A8378] leading-[1.5]">
          The planner warns you past these; it never blocks you. Defaults are{" "}
          {DEFAULT_CAPACITY.deep}/{DEFAULT_CAPACITY.medium}/{DEFAULT_CAPACITY.admin} — a guess, not a rule.
        </p>

        {observedDeep !== null && observedDeep !== prefs.capacity.deep && (
          <p className="mt-2 text-[12.5px] text-[#B07C15]">
            Your logged sessions suggest a deep number closer to {observedDeep}.
          </p>
        )}

        <div className="grid grid-cols-3 gap-3 mt-3">
          {lanes.map((l) => (
            <label key={l.name} className="block">
              <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-[#A69E90]">{l.label}</span>
              <input
                name={l.name}
                type="number"
                min={0}
                max={24}
                defaultValue={l.value}
                className="mt-1.5 w-full h-10 px-3 rounded-xl border border-[#E0D9CB] bg-[#FBF8F2] text-[14px] focus-ring"
              />
              <span className="block mt-1 text-[11px] text-[#A69E90] leading-snug">{l.hint}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[13.5px] font-semibold">Ritual times</p>
        <p className="mt-1 text-[12.5px] text-[#8A8378] leading-[1.5]">
          When Plan and Shutdown are offered. They are never notifications — the app waits for you to open it.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <label className="block">
            <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-[#A69E90]">Plan</span>
            <input name="planAt" type="time" defaultValue={prefs.planAt}
              className="mt-1.5 w-full h-10 px-3 rounded-xl border border-[#E0D9CB] bg-[#FBF8F2] text-[14px] focus-ring" />
          </label>
          <label className="block">
            <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-[#A69E90]">Shutdown</span>
            <input name="shutdownAt" type="time" defaultValue={prefs.shutdownAt}
              className="mt-1.5 w-full h-10 px-3 rounded-xl border border-[#E0D9CB] bg-[#FBF8F2] text-[14px] focus-ring" />
          </label>
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="h-10 px-5 rounded-xl bg-[#5B4FE9] hover:bg-[#4A3EDA] text-white text-[13.5px] font-semibold transition-colors focus-ring disabled:opacity-50">
        {saving ? "Saving…" : "Save tuning"}
      </button>
    </form>
  );
}
