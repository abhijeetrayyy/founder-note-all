"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toggleHabit, deleteHabit } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import type { Habit, HabitLog } from "@/lib/supabase/types";
import { HABIT_ICONS } from "@/lib/constants";

export function HabitClient({ habit, log, streak }: { habit: Habit; log?: HabitLog; streak: number }) {
  const router = useRouter();
  const toast = useToast();
  const done = !!log?.done;

  async function onToggle() {
    const result = await toggleHabit(habit.id);
    if (result.error) toast.show(result.error, "error");
    else router.refresh();
  }

  async function onDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this habit and all its logs?")) return;
    const result = await deleteHabit(habit.id);
    if (result.error) toast.show(result.error, "error");
    else router.refresh();
  }

  return (
    <div className="relative group">
      <button
        onClick={onToggle}
        aria-pressed={done}
        className={cn( "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left focus-ring",
          done ? "bg-state-done-surface border border-state-done/20" : "glass-ambient hover:glass-active",
        )}
      >
        <div
          className={cn( "w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-all duration-300",
            done ? "bg-state-done text-[#0B0B0D]" : "bg-base-raised",
          )}
        >
          {done ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <span className="font-bold text-accent">{HABIT_ICONS[habit.icon_index % HABIT_ICONS.length]}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn("font-bold text-base text-foreground", done && "line-through text-foreground-muted")}>{habit.name}</h3>
            {streak > 2 && <span className="text-xs font-extrabold text-state-attention">🔥 {streak}d</span>}
          </div>
          {habit.description ? <p className="text-sm text-foreground-muted line-clamp-1">{habit.description}</p> : null}
        </div>
        {done && <span className="text-xs font-extrabold text-state-done">DONE</span>}
      </button>
      <button
        onClick={onDelete}
        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 focus:opacity-100 w-7 h-7 rounded-lg hover:bg-state-overdue-surface text-foreground-muted hover:text-state-overdue flex items-center justify-center transition-all focus-ring"
        aria-label="Delete habit"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
      </button>
    </div>
  );
}
