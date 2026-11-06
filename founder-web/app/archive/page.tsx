"use client";

import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";
import * as A from "@/lib/actions";
import { dayKey, diffDays, longDate, weekday } from "@/lib/dates";
import { useTasks, useToday } from "@/lib/hooks";
import type { Task } from "@/lib/model";
import { ChevronLeft, Restore, Search } from "@/components/icons";
import { TaskTitle } from "@/components/task-bits";

const SHOW = 300;

function dayLabel(k: string, today: string): string {
  const d = diffDays(today, k);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${weekday(k)}, ${longDate(k)}`;
}

export default function ArchivePage() {
  const tasks = useTasks();
  const today = useToday();
  const [tab, setTab] = useState<"done" | "let-go">("done");
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const when = (t: Task) => (tab === "done" ? t.doneAt : t.letGoAt) ?? t.updatedAt;
    const items = tasks
      .filter((t) => t.status === tab && (!needle || t.title.toLowerCase().includes(needle)))
      .sort((a, b) => when(b).localeCompare(when(a)))
      .slice(0, SHOW);
    const out: { day: string; items: Task[] }[] = [];
    for (const t of items) {
      const day = dayKey(new Date(when(t)));
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(t);
      else out.push({ day, items: [t] });
    }
    return out;
  }, [tasks, tab, q]);

  const counts = useMemo(
    () => ({ done: tasks.filter((t) => t.status === "done").length, letGo: tasks.filter((t) => t.status === "let-go").length }),
    [tasks],
  );

  if (!today) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/list" className="btn-quiet -ml-2 px-2">
        <ChevronLeft className="h-4 w-4" /> List
      </Link>
      <h1 className="mt-2 font-display text-[30px] font-semibold leading-none tracking-[-0.03em]">Done and let go</h1>
      <p className="mt-2 text-[14px] text-ink-2">Nothing here is lost. Restore anything back to your list.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div role="tablist" className="inline-flex rounded-lg bg-sunk p-1">
          {([
            ["done", `Done · ${counts.done}`],
            ["let-go", `Let go · ${counts.letGo}`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={clsx(
                "rounded-md px-3 py-1.5 text-[13.5px] font-medium transition-colors",
                tab === key ? "bg-card text-ink shadow-card" : "text-ink-2 hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex h-10 min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-hair bg-card/60 px-3 focus-within:border-pen/50">
          <Search className="h-4 w-4 text-ink-3" />
          <span className="sr-only">Search the archive</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink-3"
          />
        </label>
      </div>

      {groups.length === 0 ? (
        <p className="mt-8 text-[14px] text-ink-2">
          {q ? "Nothing matches that." : tab === "done" ? "Finished tasks land here." : "Things you let go, or that faded off the list, land here."}
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.day} className="mt-7">
            <h2 className="label">{dayLabel(g.day, today)}</h2>
            <ul className="mt-1.5">
              {g.items.map((t) => (
                <li key={t.id} className="flex items-center gap-2 border-b border-hair last:border-b-0">
                  <TaskTitle
                    task={t}
                    struck={tab === "done"}
                    faded={tab === "let-go"}
                    why={tab === "let-go" ? (t.letGoReason === "faded" ? "Faded off the list" : "You let it go") : null}
                    tone="quiet"
                  />
                  <button type="button" onClick={() => A.restoreTask(t.id)} className="btn-pen shrink-0 px-2.5">
                    <Restore className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab === "done" ? "Reopen" : "Restore"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
