"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import * as A from "@/lib/actions";
import { shortDay } from "@/lib/dates";
import { useShelf, useToday } from "@/lib/hooks";
import { FADE_DAYS, LIST_HOLDS, STALE_DAYS, type Task } from "@/lib/model";
import type { Fading, Rated } from "@/lib/rank";
import { unsnooze } from "@/lib/store";
import { ArrowRight, ChevronDown, Search, Star, Sun } from "@/components/icons";
import { CheckCircle, TaskTitle } from "@/components/task-bits";

function Meter({ count, fading }: { count: number; fading: number }) {
  return (
    <div aria-label={`${count} of ${LIST_HOLDS} places used`} className="shrink-0">
      <div className="flex gap-[3px]">
        {Array.from({ length: LIST_HOLDS }, (_, i) => (
          <span
            key={i}
            className={clsx("h-3 w-[5px] rounded-[1px] transition-colors", i < count ? "bg-ink-2" : "bg-hair")}
          />
        ))}
      </div>
      <p className="mt-1.5 text-right font-mono text-[12px] text-ink-3">
        {count} of {LIST_HOLDS}
        {fading > 0 && <span className="text-red"> · {fading} fading</span>}
      </p>
    </div>
  );
}

function ListRow({ r }: { r: Rated }) {
  const t = r.task;
  return (
    <li className="group flex min-h-[56px] items-center gap-2 border-b border-rule px-4 last:border-b-0 sm:px-5">
      <CheckCircle done={false} label={`Mark "${t.title}" done`} onToggle={() => A.done(t.id)} />
      <TaskTitle task={t} why={r.why} tone={r.tone} starOnlyOnPhone />
      <button
        type="button"
        onClick={() => A.star(t.id)}
        aria-label={t.starred ? `Unstar "${t.title}"` : `Star "${t.title}"`}
        aria-pressed={t.starred}
        className={clsx(
          "icon-btn hidden md:inline-flex",
          t.starred ? "text-ink-2" : "opacity-0 focus:opacity-100 group-hover:opacity-100",
        )}
      >
        <Star filled={t.starred} className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => A.pick([t.id])} className="btn-pen shrink-0 px-2.5" aria-label={`Put "${t.title}" on Today`}>
        <Sun className="h-4 w-4" />
        <span className="hidden sm:inline">Today</span>
      </button>
    </li>
  );
}

function FadingRow({ f }: { f: Fading }) {
  const t = f.task;
  // Why it is fading is said once, above the section; each row only says when.
  const when = f.clearsIn <= 0 ? "Clears today" : f.clearsIn === 1 ? "Clears tomorrow" : `Clears in ${f.clearsIn} days`;
  return (
    <li className="flex min-h-[56px] items-center gap-2 border-b border-hair px-1 last:border-b-0">
      <TaskTitle task={t} why={when} tone="quiet" faded />
      <button type="button" onClick={() => A.keep(t.id)} className="btn-pen shrink-0 px-2.5">
        Keep
      </button>
      <button type="button" onClick={() => A.letGo(t.id)} className="btn-quiet shrink-0 px-2.5">
        Let go
      </button>
    </li>
  );
}

function LaterRow({ t, today }: { t: Task; today: string }) {
  const snoozed = t.snoozedUntil && t.snoozedUntil > today;
  return (
    <li className="flex min-h-[52px] items-center gap-2 border-b border-hair px-1 last:border-b-0">
      <TaskTitle
        task={t}
        why={snoozed ? `Snoozed till ${shortDay(t.snoozedUntil!, today)}` : t.due ? `Due ${shortDay(t.due, today)}` : null}
      />
      {snoozed ? (
        <button type="button" onClick={() => unsnooze(t.id)} className="btn-pen shrink-0 px-2.5">
          Bring back
        </button>
      ) : (
        <button type="button" onClick={() => A.pick([t.id])} className="btn-pen shrink-0 px-2.5" aria-label={`Put "${t.title}" on Today`}>
          <Sun className="h-4 w-4" />
          <span className="hidden sm:inline">Today</span>
        </button>
      )}
    </li>
  );
}

export default function ListPage() {
  const shelf = useShelf();
  const today = useToday();
  const [q, setQ] = useState("");
  const [laterOpen, setLaterOpen] = useState(false);
  if (!shelf || !today) return null;

  const needle = q.trim().toLowerCase();
  const hit = (t: Task) => !needle || t.title.toLowerCase().includes(needle) || t.details.toLowerCase().includes(needle);
  const ranked = shelf.ranked.filter((r) => hit(r.task));
  const fading = shelf.fading.filter((f) => hit(f.task));
  const later = shelf.later.filter(hit);
  const total = shelf.ranked.length + shelf.fading.length;
  const belowLine = shelf.fading.filter((f) => f.because === "below-line").length;
  const stale = shelf.fading.length - belowLine;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="font-display text-[30px] font-semibold leading-none tracking-[-0.03em]">List</h1>
          <p className="mt-2 max-w-sm text-[14px] text-ink-2">
            Everything you dumped, best first. It holds {LIST_HOLDS} — past that, the bottom fades out on its own.
          </p>
        </div>
        <Meter count={shelf.ranked.length} fading={shelf.fading.length} />
      </header>

      {total + shelf.later.length > 8 && (
        <label className="mt-6 flex h-10 items-center gap-2 rounded-lg border border-hair bg-card/60 px-3 focus-within:border-pen/50">
          <Search className="h-4 w-4 text-ink-3" />
          <span className="sr-only">Find in list</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find in list"
            className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink-3"
          />
        </label>
      )}

      {ranked.length > 0 ? (
        <ul className="mt-5 rounded-[10px] bg-card shadow-card">
          {ranked.map((r) => (
            <ListRow key={r.task.id} r={r} />
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-[10px] border border-dashed border-hair px-5 py-8 text-center text-[14px] text-ink-2">
          {needle
            ? "Nothing on the list matches that."
            : total === 0
              ? "Your list is empty. Dump anything into the box above — one line each, or paste a whole list."
              : "Everything left is below the line."}
        </p>
      )}

      {fading.length > 0 && (
        <section id="fading" className="mt-10 scroll-mt-24">
          <div className="flex items-center gap-3">
            <span className="flex-1 border-t border-dashed border-red/60" />
            <h2 className="label !text-red">Below the line</h2>
            <span className="flex-1 border-t border-dashed border-red/60" />
          </div>
          <p className="mx-auto mt-3 max-w-md text-center text-[13.5px] leading-relaxed text-ink-2">
            {belowLine > 0 && `${belowLine} didn't make the top ${LIST_HOLDS}. `}
            {stale > 0 && `${stale} ${stale === 1 ? "hasn't" : "haven't"} been touched in ${STALE_DAYS / 7} weeks. `}
            Each clears to the archive {FADE_DAYS} days after it starts fading, unless you keep it.
          </p>
          <ul className="mt-3">
            {fading.map((f) => (
              <FadingRow key={f.task.id} f={f} />
            ))}
          </ul>
        </section>
      )}

      {later.length > 0 && (
        <section className="mt-10">
          <button
            type="button"
            onClick={() => setLaterOpen((o) => !o)}
            aria-expanded={laterOpen || !!needle}
            className="flex w-full items-center gap-2 text-left"
          >
            <h2 className="label">Later · {later.length}</h2>
            <ChevronDown className={clsx("h-4 w-4 text-ink-3 transition-transform", (laterOpen || needle) && "rotate-180")} />
          </button>
          <p className="mt-1 text-[13px] text-ink-3">Snoozed, or due more than a week out. They come back to the list on their own.</p>
          {(laterOpen || !!needle) && (
            <ul className="mt-2 animate-rise">
              {later.map((t) => (
                <LaterRow key={t.id} t={t} today={today} />
              ))}
            </ul>
          )}
        </section>
      )}

      <Link href="/archive" className="mt-10 inline-flex items-center gap-1 text-[13.5px] text-ink-2 hover:text-ink">
        Done and let go <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
