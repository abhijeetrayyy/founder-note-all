"use client";

import clsx from "clsx";
import type { Tone } from "@/lib/rank";
import type { Task } from "@/lib/model";
import { openTask } from "@/lib/ui";
import { Check, Star } from "./icons";

/** The round checkbox. Big hit area, small mark. */
export function CheckCircle({ done, onToggle, label }: { done: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={onToggle}
      className="group -my-2 -ml-2.5 grid h-11 w-11 shrink-0 place-items-center rounded-full"
    >
      <span
        className={clsx(
          "grid h-[21px] w-[21px] place-items-center rounded-full border-[1.5px] transition-all duration-200",
          done
            ? "scale-100 border-ink bg-ink text-card"
            : "border-ink-3/70 text-transparent group-hover:border-pen group-hover:text-pen/50",
        )}
      >
        <Check className="h-3 w-3" strokeWidth={3.5} />
      </span>
    </button>
  );
}

const TONE: Record<Tone, string> = {
  hot: "text-red",
  warm: "text-amber",
  plain: "text-ink-3",
  quiet: "text-ink-3",
};

/** Title (opens the task) and the one-line reason it is where it is. */
export function TaskTitle({
  task,
  why,
  tone = "plain",
  struck,
  faded,
  starOnlyOnPhone,
}: {
  task: Task;
  why?: string | null;
  tone?: Tone;
  struck?: boolean;
  faded?: boolean;
  /** Where the row has its own star button on wider screens, don't draw it twice. */
  starOnlyOnPhone?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => openTask(task.id)}
      className="min-w-0 flex-1 py-3 text-left"
    >
      <span
        className={clsx(
          "block break-words text-[15px] leading-snug transition-colors",
          struck ? "text-ink-3 line-through decoration-ink-3/60" : faded ? "text-ink-3" : "text-ink",
        )}
      >
        {task.starred && !struck && (
          <Star filled className={clsx("-mt-0.5 mr-1.5 inline h-3.5 w-3.5 text-ink-2", starOnlyOnPhone && "md:hidden")} />
        )}
        {task.title}
      </span>
      {why && !struck && <span className={clsx("mt-0.5 block text-[12.5px]", TONE[tone])}>{why}</span>}
    </button>
  );
}
