"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toggleHabit } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import type { Habit, HabitLog } from "@/lib/supabase/types";

export function HabitRow({ habit, log }: { habit: Habit; log?: HabitLog }) {
  const router = useRouter();
  const toast = useToast();
  const done = !!log?.done;

  async function onToggle() {
    const result = await toggleHabit(habit.id);
    if (result.error) toast.show(result.error, "error");
    else router.refresh();
  }

  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition focus-ring",
        done
          ? "bg-success/5 border-success/30 dark:bg-success/10"
          : "bg-surface dark:bg-dark-surface border-border dark:border-dark-border hover:shadow-card",
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 transition",
          done ? "bg-success text-white" : "bg-surface-alt dark:bg-dark-surface-alt",
        )}
      >
        {done ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <HabitIcon index={habit.icon_index} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={cn("font-bold text-[15px]", done && "line-through text-text-muted dark:text-dark-text-muted")}>{habit.name}</h3>
        {habit.description ? <p className="text-sm text-text-muted dark:text-dark-text-muted line-clamp-1">{habit.description}</p> : null}
      </div>
      {done && <span className="text-xs font-extrabold text-success">DONE</span>}
    </button>
  );
}

function HabitIcon({ index }: { index: number }) {
  return (
    <span className="font-bold text-primary">{["★", "✦", "●", "▲", "■", "♥", "⚡", "✓"][index % 8]}</span>
  );
}
