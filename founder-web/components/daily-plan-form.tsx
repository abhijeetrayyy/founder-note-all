"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { saveDailyPlan } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { todayKey } from "@/lib/utils";
import type { DailyPlan } from "@/lib/supabase/types";

export function DailyPlanForm({ plan }: { plan: DailyPlan | null }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.currentTarget);
    const result = await saveDailyPlan(form);
    setPending(false);
    if (result.error) toast.show(result.error, "error");
    else {
      toast.show("Daily plan saved", "success");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="date" value={todayKey()} />
      <Input name="intention_text" defaultValue={plan?.intention_text ?? ""} placeholder="Today I will focus on…" />
      <Textarea name="blocker_notes" defaultValue={plan?.blocker_notes ?? ""} placeholder="What could get in the way?" rows={3} />
      <Textarea name="reflection_text" defaultValue={plan?.reflection_text ?? ""} placeholder="End-of-day reflection (fill later)" rows={3} />
      <Button type="submit" className="w-full h-12" disabled={pending}>
        {pending ? "Saving…" : "Save plan"}
      </Button>
    </form>
  );
}
