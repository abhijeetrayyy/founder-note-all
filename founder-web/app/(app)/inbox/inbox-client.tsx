"use client";

import * as React from "react";
import { InboxTriageItem } from "@/components/inbox-triage-item";
import type { Task } from "@/lib/supabase/types";

/**
 * Keyboard-first triage.
 *
 * Arrow keys or j/k move the focus; 1–4 answer the focused loop. The point of
 * a triage surface is that you never stop to aim — a full inbox should clear in
 * one pass without the mouse.
 */
export function InboxClient({ tasks }: { tasks: Task[] }) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault(); setIndex((i) => Math.min(i + 1, tasks.length - 1));
      }
      if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault(); setIndex((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [tasks.length]);

  // Keep the focus in range as rows leave the list.
  React.useEffect(() => {
    if (index > tasks.length - 1) setIndex(Math.max(0, tasks.length - 1));
  }, [tasks.length, index]);

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {tasks.map((task, i) => (
          <InboxTriageItem
            key={task.id}
            task={task}
            focused={i === index}
            onFocus={() => setIndex(i)}
          />
        ))}
      </div>
      <p className="mt-4 font-mono text-2xs text-[#9C9CA4]">
        ↑↓ move · 1 do · 2 tomorrow · 3 hand off · 4 let go
      </p>
    </>
  );
}
