"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { setLoopKind } from "@/lib/actions";
import type { Task } from "@/lib/supabase/types";

/**
 * Mark a loop as a decision.
 *
 * The columns for this existed from the first migration and nothing could set
 * them — LoopRow rendered a DECISION badge that was unreachable. A decision
 * asks two questions a task never does: when will you know enough, and what
 * would make the answer obvious. Usually the second is one number or one
 * conversation, and naming it is most of the work.
 */
export function DecisionControl({ task }: { task: Task }) {
  const router = useRouter();
  const toast = useToast();
  const isDecision = task.kind === 1;

  const [decideBy, setDecideBy] = React.useState(task.decide_by ?? "");
  const [unlock, setUnlock] = React.useState(task.decision_unlock ?? "");
  const [saving, setSaving] = React.useState(false);

  async function save(kind: 0 | 1) {
    setSaving(true);
    const r = await setLoopKind(task.id, kind, { decideBy, unlock });
    setSaving(false);
    if (r.error) { toast.show(r.error, "error"); return; }
    toast.show(kind === 1 ? "Tracked as a decision" : "Back to a task", "success");
    router.refresh();
  }

  return (
    <div className="rounded-[18px] border border-[#E6DFD2] bg-[#FFFDF8] p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[14.5px] font-semibold">Is this a decision?</h3>
          <p className="mt-0.5 text-[12.5px] text-[#8A8378] leading-[1.5]">
            Decisions are not doable in a focus block, so they survive every triage pass.
          </p>
        </div>
        <button
          onClick={() => save(isDecision ? 0 : 1)}
          disabled={saving}
          role="switch"
          aria-checked={isDecision}
          className={cn(
            "flex-none h-8 px-3.5 rounded-full text-[12.5px] font-semibold transition-colors focus-ring disabled:opacity-50",
            isDecision ? "bg-[#5B4FE9] text-white" : "bg-[#F1EDE3] text-[#6B6459] hover:bg-[#E7E0D2]",
          )}
        >
          {isDecision ? "Decision" : "Task"}
        </button>
      </div>

      {isDecision && (
        <div className="space-y-3 pt-1">
          <label className="block">
            <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-[#A69E90]">
              When will you know enough?
            </span>
            <input
              type="date"
              value={decideBy}
              onChange={(e) => setDecideBy(e.target.value)}
              className="mt-1.5 w-full h-10 px-3 rounded-xl border border-[#E0D9CB] bg-[#FBF8F2] text-[13.5px] focus-ring"
            />
          </label>

          <label className="block">
            <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-[#A69E90]">
              What would make this obvious?
            </span>
            <input
              value={unlock}
              onChange={(e) => setUnlock(e.target.value)}
              placeholder="Usually one number or one conversation"
              className="mt-1.5 w-full h-10 px-3 rounded-xl border border-[#E0D9CB] bg-[#FBF8F2] text-[13.5px] focus-ring"
            />
          </label>

          <button
            onClick={() => save(1)}
            disabled={saving}
            className="h-9 px-4 rounded-xl bg-[#171512] text-[#FBF8F2] text-[13px] font-semibold hover:opacity-90 transition-opacity focus-ring disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save decision"}
          </button>
        </div>
      )}
    </div>
  );
}
