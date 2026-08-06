"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Textarea, Input } from "@/components/ui/input";
import type { Task, DailyPlan } from "@/lib/supabase/types";
import { addMITAction, removeMITAction, updatePlanAction } from "@/lib/actions";

export function DailyPlanForm({ plan, allTasks }: { plan: DailyPlan | null; allTasks: Task[] }) {
  const router = useRouter(); const toast = useToast();
  const [pending, setPending] = React.useState(false);
  const [intention, setIntention] = React.useState(plan?.intention_text ?? "");
  const [blockers, setBlockers] = React.useState(plan?.blocker_notes ?? "");
  const [reflection, setReflection] = React.useState(plan?.reflection_text ?? "");
  const [mitIds, setMitIds] = React.useState<string[]>(plan?.mit_task_ids ?? []);

  React.useEffect(() => {
    setIntention(plan?.intention_text ?? ""); setBlockers(plan?.blocker_notes ?? "");
    setReflection(plan?.reflection_text ?? ""); setMitIds(plan?.mit_task_ids ?? []);
  }, [plan?.id, plan?.intention_text, plan?.blocker_notes, plan?.reflection_text, plan?.mit_task_ids]);

  const availableTasks = React.useMemo(() =>
    allTasks.filter(t => !t.completed).sort((a,b) => (b.priority??0)-(a.priority??0) || (a.due_date??"").localeCompare(b.due_date??"")), [allTasks]);

  const selectedMits = mitIds.map(id => allTasks.find(t => t.id===id)).filter((t): t is Task => Boolean(t));

  async function savePlan(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); setPending(true); const f=new FormData(); f.set("intention_text",intention); f.set("blocker_notes",blockers); f.set("reflection_text",reflection); f.set("mit_task_ids",mitIds.join(",")); const r=await updatePlanAction(f); setPending(false); if(r.error) toast.show(r.error,"error"); else { toast.show("Plan saved","success"); router.refresh(); } }

  async function toggleMit(taskId: string) {
    if (mitIds.includes(taskId)) {
      setMitIds(mitIds.filter(id=>id!==taskId)); setPending(true);
      const r=await removeMITAction(taskId); setPending(false); if(r.error) toast.show(r.error,"error"); else router.refresh();
    } else {
      if (mitIds.length>=3) { toast.show("Max 3 MITs","error"); return; }
      setMitIds([...mitIds,taskId]); setPending(true);
      const r=await addMITAction(taskId); setPending(false); if(r.error) toast.show(r.error,"error"); else router.refresh();
    }
  }

  return (
    <form onSubmit={savePlan} className="space-y-5">
      <div className="space-y-2">
        <label className="text-2xs uppercase tracking-[0.15em] text-foreground-muted font-bold block">Intention</label>
        <Input value={intention} onChange={e=>setIntention(e.target.value)} placeholder="Today I will focus on…" className="h-11 rounded-xl" />
      </div>

      <div className="space-y-2">
        <label className="text-2xs uppercase tracking-[0.15em] text-foreground-muted font-bold block">Blockers</label>
        <Textarea value={blockers} onChange={e=>setBlockers(e.target.value)} placeholder="What could get in the way?" rows={2} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-2xs uppercase tracking-[0.15em] text-foreground-muted font-bold">Priorities</span>
          <span className="text-2xs text-accent font-bold">{mitIds.length}/3</span>
        </div>

        {selectedMits.length > 0 && (
          <div className="space-y-2">
            {selectedMits.map((t,i) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-accent-muted border border-accent-muted-strong">
                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-600 to-accent-700 text-white flex items-center justify-center text-xs font-bold shrink-0">{i+1}</span>
                <div className="flex-1 min-w-0"><p className="font-semibold text-sm text-foreground truncate">{t.title}</p>{t.estimated_minutes && <p className="text-xs text-foreground-subtle">{t.estimated_minutes} min</p>}</div>
                <button type="button" onClick={()=>toggleMit(t.id)} disabled={pending} className="text-xs font-semibold text-state-overdue hover:underline focus-ring">Remove</button>
              </div>
            ))}
          </div>
        )}
        {selectedMits.length === 0 && <p className="text-sm text-foreground-muted italic">Pick 1–3 priorities for today.</p>}

        {mitIds.length < 3 && availableTasks.filter(t=>!mitIds.includes(t.id)).length > 0 && (
          <div className="space-y-1 max-h-56 overflow-y-auto pr-1 scrollbar-hide">
            {availableTasks.filter(t=>!mitIds.includes(t.id)).slice(0,12).map(t=>(
              <button key={t.id} type="button" onClick={()=>toggleMit(t.id)} disabled={pending}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-base-raised hover:bg-base-overlay border border-transparent hover:border-accent/20 transition-colors text-left focus-ring">
                <span className="w-5 h-5 rounded-full border-2 border-base-border shrink-0" />
                <div className="flex-1 min-w-0"><p className="font-semibold text-sm text-foreground truncate">{t.title}</p><p className="text-xs text-foreground-subtle">{t.estimated_minutes?`${t.estimated_minutes} min`:"—"}{t.due_date?` · ${format(new Date(t.due_date),"MMM d")}`:""}</p></div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-2xs uppercase tracking-[0.15em] text-foreground-muted font-bold block">Reflection</label>
        <Textarea value={reflection} onChange={e=>setReflection(e.target.value)} placeholder="What did you ship? What's ahead?" rows={3} />
      </div>

      <Button type="submit" className="w-full h-11 rounded-xl" disabled={pending}>{pending?"Saving…":"Save plan"}</Button>
    </form>
  );
}
