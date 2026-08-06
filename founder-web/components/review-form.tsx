"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { saveWeeklyReview } from "@/lib/actions";
import { REVIEW_PROMPTS } from "@/lib/constants";
import type { WeeklyReview } from "@/lib/supabase/types";

export function ReviewForm({ weekStart, existing }: { weekStart: string; existing: WeeklyReview | null }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState(false);
  const [saved, setSaved] = React.useState(!!existing);
  const [values, setValues] = React.useState({
    accomplishments: existing?.accomplishments ?? "",
    challenges: existing?.challenges ?? "",
    next_priorities: existing?.next_priorities ?? "",
    habits_adjustment: existing?.habits_adjustment ?? "",
  });

  function set(key: string, val: string) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function save() {
    setPending(true);
    const form = new FormData();
    form.set("week_start", weekStart);
    form.set("accomplishments", values.accomplishments);
    form.set("challenges", values.challenges);
    form.set("next_priorities", values.next_priorities);
    form.set("habits_adjustment", values.habits_adjustment);
    const result = await saveWeeklyReview(form);
    setPending(false);
    if (result.error) toast.show(result.error, "error");
    else {
      setSaved(true);
      toast.show("Review saved", "success");
      router.refresh();
    }
  }

  return (
    <>
      {REVIEW_PROMPTS.map((p, i) => (
        <div key={p.key} className="space-y-2">
          <div className="flex gap-3 items-start">
            <span className="w-6 h-6 rounded-full bg-accent-muted text-accent flex items-center justify-center text-xs font-bold shrink-0 mt-1">{i + 1}</span>
            <label className="text-[15px] font-semibold text-foreground">{p.label}</label>
          </div>
          <Textarea
            value={values[p.key]}
            onChange={(e) => set(p.key, e.target.value)}
            placeholder="Write your thoughts…"
            rows={3}
          />
        </div>
      ))}
      <Button onClick={save} className="w-full h-12" disabled={pending}>
        {pending ? "Saving…" : saved ? "Update review" : "Save review"}
      </Button>
      {saved && <p className="text-xs text-center text-state-done font-bold">✓ Review saved for this week</p>}
    </>
  );
}
