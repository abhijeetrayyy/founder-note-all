"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toggleHabit, retireHabit, restoreHabit } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import type { Habit, HabitLog } from "@/lib/supabase/types";

/**
 * One personal ritual.
 *
 * The streak is shown, but small and after the fact — never as the headline and
 * never with a flame. The number a founder should read here is "kept 9 of the
 * last 14", which survives a bad Tuesday; "🔥 12" does not, and the day it
 * breaks is the day the page stops being opened.
 */
export function HabitClient({ habit, log, streak }: { habit: Habit; log?: HabitLog; streak: number }) {
  const router = useRouter();
  const toast = useToast();
  const done = !!log?.done;

  async function onToggle() {
    const result = await toggleHabit(habit.id);
    if (result.error) toast.show(result.error, "error");
    else router.refresh();
  }

  async function onRetire(e: React.MouseEvent) {
    e.stopPropagation();
    const result = await retireHabit(habit.id);
    if (result.error) { toast.show(result.error, "error"); return; }
    toast.show(`Retired "${habit.name}"`, "success", {
      label: "Undo",
      onClick: async () => { await restoreHabit(habit.id); router.refresh(); },
    });
    router.refresh();
  }

  return (
    <div className="group relative flex items-center gap-3.5">
      <button
        onClick={onToggle}
        aria-pressed={done}
        className={cn(
          "flex-1 flex items-center gap-3.5 px-4 py-3.5 rounded-[6px] border text-left transition-colors focus-ring",
          done ? "border-[#26262B] bg-[#101013]" : "border-[#26262B] bg-[#1B1B1F] hover:border-[#35353C]",
        )}
      >
        <span
          className={cn(
            "w-[22px] h-[22px] rounded-[5px] flex-none flex items-center justify-center transition-colors",
            done ? "bg-[#5EE0B0] text-[#0B0B0D]" : "border-[1.5px] border-[#3A3A41] text-transparent",
          )}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"
            className={done ? "check-draw" : undefined}>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>

        <span className="flex-1 min-w-0">
          <span className={cn("block text-base leading-snug", done && "text-[#9C9CA4] line-through")}>{habit.name}</span>
          {habit.description ? <span className="block mt-0.5 text-xs text-[#9C9CA4] truncate">{habit.description}</span> : null}
        </span>

        {streak > 2 && (
          <span className="flex-none font-mono text-2xs text-[#9C9CA4]">{streak}d running</span>
        )}
      </button>

      <button
        onClick={onRetire}
        className="flex-none px-2.5 py-1.5 rounded-[5px] text-2xs text-[#9C9CA4] opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-[#F0F0EE] hover:bg-[#1B1B1F] transition-all focus-ring"
        aria-label={`Retire ${habit.name}`}
      >
        Retire
      </button>
    </div>
  );
}
