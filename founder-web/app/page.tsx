"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import * as A from "@/lib/actions";
import { longDate, weekday } from "@/lib/dates";
import { useNow, useShelf, useToday } from "@/lib/hooks";
import { BUSY_TODAY, PICK_BATCH, type Task } from "@/lib/model";
import { rate, type Rated } from "@/lib/rank";
import { ArrowRight, Back, Plus } from "@/components/icons";
import { DeleteButton, swipeBack, swipeDelete, swipeDone, swipeHintSeen, swipeToday } from "@/components/row-actions";
import { Swipe } from "@/components/swipe";
import { CheckCircle, TaskTitle } from "@/components/task-bits";

const MIN_ROWS = 4;

function OpenRow({ task, today, now }: { task: Task; today: string; now: Date }) {
  const [checking, setChecking] = useState(false);
  const r = rate(task, today, now);
  const showWhy = r.tone === "hot" || r.tone === "warm";
  return (
    <li className="border-b border-rule">
      <Swipe left={swipeDone(task.id)} right={swipeBack(task.id)} onSwiped={swipeHintSeen}>
        <div className="group flex min-h-[56px] items-center gap-3 px-5 sm:px-6">
          <CheckCircle
            done={checking}
            label={`Mark "${task.title}" done`}
            onToggle={() => {
              if (checking) return;
              setChecking(true);
              setTimeout(() => A.done(task.id), 320);
            }}
          />
          <TaskTitle task={task} why={showWhy ? r.why : null} tone={r.tone} struck={checking} />
          <DeleteButton id={task.id} title={task.title} />
          <button
            type="button"
            onClick={() => A.unpick(task.id)}
            aria-label={`Send "${task.title}" back to the list`}
            title="Back to list"
            className="icon-btn hidden opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 md:inline-flex"
          >
            <Back className="h-4 w-4" />
          </button>
        </div>
      </Swipe>
    </li>
  );
}

function DoneRow({ task }: { task: Task }) {
  return (
    <li className="flex min-h-[56px] items-center gap-3 border-b border-rule px-5 sm:px-6">
      <CheckCircle done label={`Mark "${task.title}" not done`} onToggle={() => A.reopen(task.id)} />
      <TaskTitle task={task} struck />
    </li>
  );
}

function TodayCard({ open, done, listEmpty }: { open: Task[]; done: Task[]; listEmpty: boolean }) {
  const today = useToday()!;
  const now = useNow()!;
  const total = open.length + done.length;
  // Only what was picked for today counts as "everything you picked" — a task
  // ticked off straight from the list is done today, but was never on the plan.
  const pickedDone = done.filter((t) => t.pickedFor === today).length;
  const message =
    open.length > 0
      ? null
      : pickedDone > 0
        ? "Everything you picked is done. Pick more when you're ready."
        : listEmpty
          ? "Nothing here yet. Dump what's on your mind into the box above."
          : "Nothing picked yet. Choose a few from Up next.";
  const blanks = Math.max(0, MIN_ROWS - total - (message ? 1 : 0));

  return (
    <section aria-label="Today" className="overflow-hidden rounded-[10px] bg-card shadow-card">
      <header className="flex items-end justify-between gap-4 px-5 pb-3.5 pt-5 sm:px-6 sm:pt-6">
        <div>
          <h1 className="font-display text-[34px] font-semibold leading-none tracking-[-0.035em] sm:text-[40px]">{weekday(today)}</h1>
          <p className="mt-2 text-[14px] text-ink-2">{longDate(today)}</p>
        </div>
        {total > 0 && (
          <p className="pb-0.5 font-mono text-[12px] text-ink-3">
            {done.length} of {total} done
          </p>
        )}
      </header>
      <div className="h-[2px] bg-red/85" />
      <ul>
        {open.map((t) => (
          <OpenRow key={t.id} task={t} today={today} now={now} />
        ))}
        {message && (
          <li className="flex min-h-[56px] items-center border-b border-rule px-5 text-[14px] text-ink-3 sm:px-6">
            {message}
          </li>
        )}
        {done.map((t) => (
          <DoneRow key={t.id} task={t} />
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <li key={`blank-${i}`} aria-hidden className="h-[56px] border-b border-rule last:border-b-0" />
        ))}
      </ul>
      {open.length > BUSY_TODAY && (
        <p className="px-5 py-3 text-[13px] text-amber sm:px-6">
          {open.length} open at once. Finishing a few beats picking more.
        </p>
      )}
    </section>
  );
}

function NextRow({ r }: { r: Rated }) {
  const t = r.task;
  return (
    <li className="border-b border-hair last:border-b-0">
      <Swipe left={swipeToday(t.id)} right={swipeDelete(t.id)} surface="bg-desk" onSwiped={swipeHintSeen}>
        <div className="group flex items-center gap-2">
          <TaskTitle task={t} why={r.why} tone={r.tone} />
          <DeleteButton id={t.id} title={t.title} />
          <button type="button" onClick={() => A.pick([t.id])} className="btn-pen shrink-0 px-2.5" aria-label={`Put "${t.title}" on Today`}>
            <Plus className="h-4 w-4" /> Today
          </button>
        </div>
      </Swipe>
    </li>
  );
}

function UpNext({ ranked, fading, count, openToday, doneToday }: {
  ranked: Rated[];
  fading: number;
  count: number;
  openToday: number;
  doneToday: number;
}) {
  const offerBatch = openToday === 0 && ranked.length > 0;
  const batch = ranked.slice(0, PICK_BATCH);
  const rest = ranked.slice(offerBatch ? batch.length : 0, offerBatch ? batch.length + 2 : 5);

  return (
    <section aria-labelledby="up-next" className="md:pt-2">
      <div className="flex items-baseline justify-between">
        <h2 id="up-next" className="label">Up next</h2>
        {count > 0 && (
          <Link href="/list" className="flex items-center gap-1 text-[13px] text-pen hover:underline">
            Whole list · {count} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {ranked.length === 0 ? (
        <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
          {count === 0 && openToday + doneToday === 0
            ? "Everything you dump lands on your list, ranked by deadlines, stars and what keeps coming back. The best few show up here."
            : "Nothing else waiting on your list."}
        </p>
      ) : (
        <>
          <ul className="mt-2">
            {(offerBatch ? batch : []).map((r) => (
              <NextRow key={r.task.id} r={r} />
            ))}
          </ul>
          {offerBatch && (
            <button
              type="button"
              onClick={() => A.pick(batch.map((r) => r.task.id))}
              className="btn-ink mt-3 h-11 w-full text-[15px]"
            >
              {doneToday > 0 ? `Pick ${batch.length} more` : batch.length === 1 ? "Pick this one" : `Pick these ${batch.length}`}
            </button>
          )}
          {rest.length > 0 && (
            <>
              {offerBatch && <p className="label mt-6">After that</p>}
              <ul className={clsx(offerBatch ? "mt-1" : "mt-2")}>
                {rest.map((r) => (
                  <NextRow key={r.task.id} r={r} />
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {fading > 0 && (
        <Link href="/list#fading" className="mt-5 flex items-center gap-1 text-[13px] text-red hover:underline">
          {fading} fading from your list — keep or delete <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </section>
  );
}

export default function TodayPage() {
  const shelf = useShelf();
  const today = useToday();
  if (!shelf) return null;
  const count = shelf.ranked.length + shelf.fading.length;
  return (
    <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:gap-12">
      <TodayCard open={shelf.today} done={shelf.doneToday} listEmpty={count === 0} />
      <UpNext
        ranked={shelf.ranked}
        fading={shelf.fading.length}
        count={count}
        openToday={shelf.today.length}
        doneToday={shelf.doneToday.filter((t) => t.pickedFor === today).length}
      />
    </div>
  );
}
