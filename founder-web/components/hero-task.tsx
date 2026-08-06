"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toggleTask } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/supabase/types";

const ENERGY_LABELS = ["Admin", "Medium", "Deep"];
const ENERGY_COLORS = ["text-emerald-400", "text-blue-400", "text-purple-400"];
const ENERGY_BG = ["bg-emerald-400/10", "bg-blue-400/10", "bg-purple-400/10"];

export function HeroTask({ task, index, total }: { task: Task; index: number; total: number }) {
  const router = useRouter(); const toast = useToast();
  const [done, setDone] = React.useState(task.completed);
  const [animating, setAnimating] = React.useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    setAnimating(true);
    const r = await toggleTask(task.id, !done);
    if (r.error) { toast.show(r.error, "error"); setAnimating(false); return; }
    setDone(true);
    toast.show("Done! 🎉", "success");
    setTimeout(() => { setAnimating(false); router.refresh(); }, 1200);
  }

  const energy = task.energy_level ?? 1;
  const eLabel = ENERGY_LABELS[energy] ?? "Medium";
  const eColor = ENERGY_COLORS[energy];
  const eBg = ENERGY_BG[energy];

  return (
    <div className={cn(
      "relative p-6 rounded-card glass-active transition-all duration-700",
      animating && "animate-dissolve opacity-30 scale-[0.98] blur-[2px]",
      done && "opacity-40"
    )}>
      {/* Status bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold", done ? "bg-state-done/15 text-state-done" : "bg-accent-muted text-accent")}>
          {done ? "✓" : index + 1}
        </div>
        <span className="text-2xs uppercase tracking-wider text-foreground-subtle font-bold">
          {total === 1 ? "THE ONE THING" : `PRIORITY ${index + 1} OF ${total}`}
        </span>
      </div>

      {/* Title */}
      <Link href={`/tasks/${task.id}`} className="block group">
        <h3 className={cn("text-xl font-bold text-foreground mb-3 leading-tight", done && "line-through")}>
          {task.title}
        </h3>
      </Link>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        {task.estimated_minutes && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-muted">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            {task.estimated_minutes}m
          </span>
        )}
        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", eColor, eBg)}>
          {eLabel}
        </span>
        {task.due_date && (
          <span className="text-xs font-semibold text-foreground-muted">
            {new Date(task.due_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          disabled={done || animating}
          className={cn(
            "h-11 px-5 rounded-xl text-sm font-bold transition-all duration-300 focus-ring",
            done
              ? "bg-state-done/10 text-state-done cursor-default"
              : "bg-accent-600 text-white hover:bg-accent-500 hover:shadow-glow active:scale-[0.97]"
          )}
        >
          {done ? "Completed" : "Mark complete"}
        </button>
        <Link href={`/focus?task=${task.id}`}
              className="h-11 px-4 rounded-xl glass-ambient hover:glass-active text-sm font-semibold text-foreground-muted hover:text-foreground flex items-center gap-2 transition-all duration-300">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          Start focus
        </Link>
      </div>
    </div>
  );
}
