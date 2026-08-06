"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateTask, deleteTask } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { todayKey, cn } from "@/lib/utils";
import type { Task } from "@/lib/supabase/types";

export function InboxTriageItem({ task }: { task: Task }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState<string | null>(null);
  const [gone, setGone] = React.useState(false);

  async function act(action: string, run: () => Promise<{ error?: string }>) {
    setPending(action);
    const r = await run();
    if (r.error) { toast.show(r.error, "error"); setPending(null); return; }
    setGone(true);
    setTimeout(() => router.refresh(), 350);
  }

  const doToday = () => act("today", () => updateTask(task.id, { is_inbox: false, due_date: todayKey() }));
  const doTomorrow = () => act("tomorrow", () => updateTask(task.id, { is_inbox: false, due_date: todayKey(new Date(Date.now() + 86400000)) }));
  const doSomeday = () => act("someday", () => updateTask(task.id, { is_inbox: false, due_date: null }));
  const doDiscard = () => act("discard", () => deleteTask(task.id));

  return (
    <div className={cn("rounded-2xl glass-ambient p-4 transition-all duration-300", gone && "animate-dissolve pointer-events-none")}>
      <Link href={`/tasks/${task.id}`} className="block mb-3 hover:text-accent transition-colors">
        <p className="text-sm font-semibold text-foreground leading-snug">{task.title}</p>
        {task.description && <p className="mt-1 text-xs text-foreground-muted line-clamp-2">{task.description}</p>}
      </Link>
      <div className="flex flex-wrap gap-1.5">
        <TriageButton label="Do today" onClick={doToday} busy={pending === "today"} tone="accent" />
        <TriageButton label="Tomorrow" onClick={doTomorrow} busy={pending === "tomorrow"} />
        <TriageButton label="Someday" onClick={doSomeday} busy={pending === "someday"} />
        <TriageButton label="Discard" onClick={doDiscard} busy={pending === "discard"} tone="danger" />
      </div>
    </div>
  );
}

function TriageButton({ label, onClick, busy, tone }: { label: string; onClick: () => void; busy: boolean; tone?: "accent" | "danger" }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={cn(
        "h-8 px-3 rounded-full text-xs font-semibold transition-colors focus-ring disabled:opacity-50",
        tone === "accent" && "bg-accent-600 text-white hover:shadow-glow",
        tone === "danger" && "text-state-overdue hover:bg-state-overdue-surface",
        !tone && "bg-base-raised text-foreground-muted hover:bg-base-overlay",
      )}
    >
      {label}
    </button>
  );
}
