"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toggleTask, saveEnergyLevel } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { InlineCapture } from "@/components/inline-capture";
import { EMPTY_PRESSURE, DEFAULT_CAPACITY, capacityFit, draftNextMove, decayTone, loopAge, type Pressure, type CapacityShape } from "@/lib/loops";
import { energyLabel, type Task, type Note, type Goal, type Habit, type HabitLog, type DailyPlan } from "@/lib/supabase/types";

/**
 * Today.
 *
 * Two columns. Left: the one thing, capacity, the rotting shelf, the day's
 * list. Right: energy, the three MITs, the anti-list and rituals. Colour only
 * appears where something needs answering or has just resolved.
 */
export function TodayClient({
  energy, plan, mits, restTasks, habits, habitLogs, notes: _notes, goals: _goals,
  name: _name, summary, pressure = EMPTY_PRESSURE, antiList = [], capacity: limit,
  momentum = { run: 0, last7: 0, oldestClosed: 0 },
}: {
  name: string | null; energy: number; plan: DailyPlan | null;
  mits: Task[]; restTasks: Task[]; habits: Habit[]; habitLogs: HabitLog[]; goals: Goal[]; notes: Note[];
  summary: { inbox_count: number; due_today_count: number; completed_today_count: number; habits_done_today: number };
  pressure?: Pressure; antiList?: Task[]; capacity?: CapacityShape;
  momentum?: { run: number; last7: number; oldestClosed: number };
}) {
  const activeMits = mits.filter((t) => !t.completed);
  const openRest = restTasks.filter((t) => !t.completed);
  const one = activeMits[0] ?? openRest[0] ?? null;
  const dayTasks = [...mits, ...restTasks];
  const doneCount = dayTasks.filter((t) => t.completed).length;
  // Uses the founder's tuned numbers when they have set them.
  const capacity = capacityFit(dayTasks, limit ?? { ...DEFAULT_CAPACITY });
  const rotting = [...mits, ...restTasks].filter((t) => decayTone(t) !== "fresh");

  return (
    <div className="flex-1 w-full max-w-[1180px] mx-auto px-5 sm:px-7 pt-7 pb-16">
      <Welcome momentum={momentum} shipped={summary.completed_today_count} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-[22px] items-start">
        {/* ── Left ── */}
        <div className="flex flex-col gap-5">
          {/* Keyed by task id so the card remounts when the one thing changes.
              Without it React reuses the instance across the post-completion
              refresh, and the *next* task inherits done=true — telling the
              founder something is closed when it is not. */}
          {one ? <OneThing key={one.id} task={one} energy={energy} /> : <NoPlanCard />}

          <CapacityCard fit={capacity} />

          {rotting.length > 0 && <RottingCard loops={rotting} />}

          <UnblockPrompt count={pressure.blocked_count} />

          <div className="rounded-[8px] border border-[#26262B] bg-[#141417] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#26262B] flex items-center justify-between">
              <h3 className="text-base font-semibold">Today · {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}</h3>
              <span className="font-mono text-2xs text-[#9C9CA4]">{doneCount} done</span>
            </div>
            {dayTasks.length ? dayTasks.map((t) => <TaskRow key={t.id} task={t} />) : (
              <p className="px-5 py-6 text-sm text-[#9C9CA4]">Nothing committed to today yet.</p>
            )}
          </div>

          <InlineCapture />
        </div>

        {/* ── Right ── */}
        <div className="flex flex-col gap-5">
          <EnergyCard energy={energy} plan={plan} />
          <MitsCard mits={mits} />
          <AntiListCard tasks={antiList} />
          <RitualsCard habits={habits} logs={habitLogs} done={summary.habits_done_today} />
        </div>
      </div>
    </div>
  );
}

/* ── The one thing, on ink ── */
function OneThing({ task, energy }: { task: Task; energy: number }) {
  const router = useRouter();
  const toast = useToast();
  const [done, setDone] = React.useState(false);
  const move = draftNextMove(task);
  const minutes = task.energy_level === 2 ? 50 : task.energy_level === 1 ? 25 : 10;

  // How long this had been carried. The one number worth saying back.
  const age = Math.floor((Date.now() - new Date(task.created_at).getTime()) / 86_400_000);

  async function complete() {
    setDone(true);
    const r = await toggleTask(task.id, true);
    if (r.error) { toast.show(r.error, "error"); setDone(false); return; }
    // Long enough to read the acknowledgement, short enough not to be theatre.
    setTimeout(() => router.refresh(), 2400);
  }

  // The moment. Not a celebration — a receipt for something that was weighing.
  if (done) {
    return (
      <section className="rounded-[8px] bg-[#141417] text-[#F0F0EE] p-6 animate-rise">
        <p className="font-mono text-2xs tracking-[0.14em] uppercase text-[#5EE0B0]">Closed</p>
        <h2 className="mt-3 font-display text-4xl leading-[1.1] line-through decoration-[#35353C] decoration-1">
          {task.title}
        </h2>
        <p className="mt-4 text-base text-[#9C9CA4] animate-rise delay-2">
          {age >= 7
            ? `You had been carrying that one for ${age} days.`
            : age >= 1
            ? `Open since ${age === 1 ? "yesterday" : `${age} days ago`}. Gone now.`
            : "Straight through. Nothing left of it."}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[8px] bg-[#F0F0EE] text-[#0B0B0D] p-6 relative overflow-hidden">
      <p className="font-mono text-2xs tracking-[0.14em] uppercase text-[#0B0B0D]/55">
        The one thing · matched to {energyLabel(energy as 0 | 1 | 2)} energy
      </p>

      <Link href={`/tasks/${task.id}`} className="block group">
        <h2 className="font-display text-4xl leading-[1.1] tracking-[-0.015em] mt-3.5 group-hover:text-[#3A3A41] transition-colors">
          {task.title}
        </h2>
      </Link>

      <div className="flex flex-wrap gap-2 mt-4">
        {/* This card is the one lit surface in the app, so everything on it
            takes void-side colours. Left on the dark palette it was white on
            white. */}
        <span className="text-xs text-[#0B0B0D] border border-[#0B0B0D]/25 px-2.5 py-[5px] rounded-[6px]">
          {energyLabel(task.energy_level as 0 | 1 | 2)}
        </span>
        {task.priority === 2 && (
          <span className="text-xs text-[#8A4E12] border border-[#8A4E12]/30 bg-[#8A4E12]/[0.07] px-2.5 py-[5px] rounded-[6px]">High priority</span>
        )}
        {task.due_date && (
          <span className="text-xs text-[#0B0B0D]/60 border border-[#0B0B0D]/20 px-2.5 py-[5px] rounded-[6px]">Due today</span>
        )}
      </div>

      <div className="mt-5 p-4 rounded-[6px] bg-[#0B0B0D]/[0.055] border border-[#0B0B0D]/12">
        <p className="font-mono text-2xs tracking-[0.12em] uppercase text-[#0B0B0D]/55">First micro-step</p>
        <p className="mt-2 text-base text-[#0B0B0D]">{move}</p>
      </div>

      <div className="flex gap-2.5 mt-5 flex-wrap">
        <Link href={`/focus?task=${task.id}`}
          className="rounded-[6px] bg-[#0B0B0D] hover:bg-[#26262B] text-[#F0F0EE] text-base font-medium px-[18px] py-3 flex items-center gap-2 transition-colors focus-ring">
          <PlayIcon /> Start focus · {minutes}m
        </Link>
        <button onClick={complete}
          className="rounded-[6px] border border-[#0B0B0D]/25 hover:border-[#0B0B0D]/55 text-[#0B0B0D] text-base px-4 py-3 transition-colors focus-ring">
          Mark done
        </button>
        <Link href="/loops"
          className="rounded-[6px] border border-[#0B0B0D]/25 hover:border-[#0B0B0D]/55 text-[#0B0B0D] text-base px-4 py-3 transition-colors focus-ring">
          Not now, show another
        </Link>
      </div>
    </section>
  );
}

function NoPlanCard() {
  return (
    <section className="rounded-[8px] bg-[#141417] text-[#F0F0EE] p-6">
      <p className="font-mono text-2xs tracking-[0.14em] uppercase text-[#6E6E77]">The one thing</p>
      <h2 className="font-display text-4xl leading-[1.1] tracking-[-0.015em] mt-3.5">Nothing is chosen yet.</h2>
      <p className="mt-3 text-base text-[#9C9CA4] max-w-md">
        Sixty guided seconds replace twenty minutes of deciding.
      </p>
      <Link href="/plan"
        className="mt-5 inline-flex rounded-[6px] bg-[#F0F0EE] hover:bg-[#FFFFFF] text-[#0B0B0D] text-base font-semibold px-[18px] py-3 items-center gap-2 transition-colors focus-ring">
        Plan the day · 60s
      </Link>
    </section>
  );
}

/* ── The return ──
   The first line a founder reads when they come back. Its whole job is to make
   opening the app feel like relief rather than an inbox.

   It never says what you failed to do, and it never nags. When the app has
   nothing useful to say it says nothing at all — an app that greets you every
   single time is a needy one. */
function Welcome({ momentum, shipped }: {
  momentum: { run: number; last7: number; oldestClosed: number };
  shipped: number;
}) {
  const [line, setLine] = React.useState<string | null>(null);

  React.useEffect(() => {
    const KEY = "founderos:lastVisit";
    const prev = Number(localStorage.getItem(KEY) ?? 0);
    const hoursAway = prev ? (Date.now() - prev) / 3_600_000 : 0;
    localStorage.setItem(KEY, String(Date.now()));

    // Only worth saying on a genuine return, not on every navigation.
    if (prev && hoursAway < 6) return;

    if (shipped > 0) {
      setLine(`${shipped} closed already today.`);
    } else if (momentum.oldestClosed >= 7) {
      setLine(`This week you finished something that had been open ${momentum.oldestClosed} days.`);
    } else if (momentum.run >= 3) {
      setLine(`You have closed something on ${momentum.run} days running.`);
    } else if (momentum.last7 > 0) {
      setLine(`${momentum.last7} loops closed in the last week.`);
    }
  }, [momentum.run, momentum.last7, momentum.oldestClosed, shipped]);

  if (!line) return null;

  return (
    <p className="mb-5 text-base text-[#9C9CA4] animate-rise">
      <span className="text-[#5EE0B0]">●</span> {line}
    </p>
  );
}

/* ── Unblock ──
   The daily batch has to arrive, not be discovered. It appears in the
   afternoon, when deep work is over and admin is possible — thirty seconds
   that moves several loops into someone else's court. */
function UnblockPrompt({ count }: { count: number }) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    // Decided after mount: the server's clock is in a different timezone.
    setShow(count > 0 && new Date().getHours() >= 14);
  }, [count]);

  if (!show) return null;
  return (
    <Link href="/unblock"
      className="group rounded-[8px] border border-[#26262B] bg-[#141417] p-5 flex items-center gap-4 hover:border-[#35353C] transition-colors focus-ring">
      <div className="flex-1">
        <h3 className="text-base font-semibold">
          You are waiting on {count} {count === 1 ? "person" : "people"}
        </h3>
        <p className="mt-1.5 text-sm text-[#9C9CA4] leading-[1.5]">
          Thirty seconds to move {count === 1 ? "it" : "them all"} into someone else&apos;s court.
          The drafts are already written.
        </p>
      </div>
      <span className="text-[#6E6E77] group-hover:text-[#F0F0EE] transition-colors">→</span>
    </Link>
  );
}

/* ── Capacity ── */
function CapacityCard({ fit }: { fit: ReturnType<typeof capacityFit> }) {
  const lanes = [
    { k: "deep" as const, label: "Deep", color: "#F0F0EE" },
    { k: "medium" as const, label: "Medium", color: "#7FA6D9" },
    { k: "admin" as const, label: "Admin", color: "#5EE0B0" },
  ];
  return (
    <section className="rounded-[8px] border border-[#26262B] bg-[#141417] p-5">
      <div className="flex items-baseline justify-between gap-3.5">
        <h3 className="text-base font-semibold">Today&apos;s capacity</h3>
        <span className="font-mono text-2xs text-[#9C9CA4]">
          {fit.advice ? "over budget" : "what a day of yours holds"}
        </span>
      </div>
      <div className="flex flex-col gap-3.5 mt-4">
        {lanes.map((l) => {
          const used = fit.used[l.k], total = fit.limit[l.k];
          return (
            <div key={l.k}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium">{l.label}</span>
                <span className="font-mono text-2xs text-[#9C9CA4]">{used} of {total} used</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: Math.max(total, used) }, (_, i) => (
                  <span key={i} className="flex-1 h-2 rounded-full"
                    style={{ background: i >= total ? "#FF8A4C" : i < used ? l.color : "#26262B" }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {fit.advice && <p className="mt-3.5 text-xs text-[#E0A33E]">{fit.advice}</p>}
    </section>
  );
}

/* ── Rotting ── */
function RottingCard({ loops }: { loops: Task[] }) {
  return (
    <section className="rounded-[8px] border border-[#35353C] bg-[#1B1B1F] p-5">
      <div className="flex items-center gap-2.5">
        <HourglassIcon />
        <h3 className="text-base font-semibold">
          {loops.length} {loops.length === 1 ? "loop is" : "loops are"} rotting
        </h3>
      </div>
      <p className="mt-2 text-sm text-[#E0A33E] leading-[1.5]">
        Answer each one: do it, schedule it, hand it off, or drop it. Ninety seconds and the pressure drops.
      </p>
      <div className="flex flex-col gap-2.5 mt-3.5">
        {loops.slice(0, 4).map((t) => {
          const age = loopAge(t);
          const hot = decayTone(t) === "rotting";
          return (
            <Link key={t.id} href={`/tasks/${t.id}`}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-[#141417] border border-[#35353C] hover:border-[#FF8A4C] transition-colors">
              <span className="flex-1 text-base leading-[1.4]">{t.title}</span>
              <span className="font-mono text-2xs" style={{ color: hot ? "#FF8A4C" : "#E0A33E" }}>
                {age} days
              </span>
            </Link>
          );
        })}
      </div>
      <Link href="/loops?filter=rotting"
        className="mt-3.5 inline-flex rounded-[6px] bg-[#141417] hover:bg-[#FF8A4C] text-[#F0F0EE] text-sm font-medium px-[17px] py-[11px] transition-colors focus-ring">
        Answer them now
      </Link>
    </section>
  );
}

/* ── Day list ── */
function TaskRow({ task }: { task: Task }) {
  const router = useRouter();
  const toast = useToast();
  const [done, setDone] = React.useState(task.completed);
  // Separate ink from tint: one hex for both meant the label sat on a 14%
  // wash of itself and never cleared contrast.
  const tint: Record<number, string> = { 0: "#5EE0B0", 1: "#7FA6D9", 2: "#F0F0EE" };
  const ink: Record<number, string> = { 0: "#5EE0B0", 1: "#7FA6D9", 2: "#FFFFFF" };
  const c = tint[task.energy_level] ?? "#7FA6D9";
  const fg = ink[task.energy_level] ?? "#7FA6D9";

  // Optimistic: the tick lands the instant it is pressed, and the row settles
  // out before the refresh. Waiting on a round trip to acknowledge a tap is
  // what makes an app feel like paperwork.
  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    const next = !done;
    setDone(next);
    const r = await toggleTask(task.id, next);
    if (r.error) { toast.show(r.error, "error"); setDone(!next); return; }
    setTimeout(() => router.refresh(), next ? 700 : 300);
  }

  return (
    <Link href={`/tasks/${task.id}`}
      className={cn( "flex items-center gap-[13px] px-5 py-3.5 border-b border-[#26262B] last:border-b-0 hover:bg-[#101013] transition-colors",
        done && !task.completed && "animate-settle",
      )}>
      <button onClick={toggle} aria-label={done ? "Mark not done" : "Mark done"}
        className={cn("w-[19px] h-[19px] rounded-md flex-none flex items-center justify-center transition-colors focus-ring",
          done ? "bg-[#F0F0EE] text-[#0B0B0D]" : "border-[1.5px] border-[#3A3A41] text-transparent")}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"
          className={done ? "check-draw" : undefined}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-base", done ? "text-[#9C9CA4] line-through" : "font-medium")}>{task.title}</p>
        {task.first_step && <p className="mt-[3px] text-xs text-[#9C9CA4] truncate">{task.first_step}</p>}
      </div>
      <span className="flex-none text-2xs font-medium px-2.5 py-1 rounded-md" style={{ color: fg, background: `${c}14` }}>
        {energyLabel(task.energy_level as 0 | 1 | 2)}
      </span>
    </Link>
  );
}

/* ── Right column ── */
function EnergyCard({ energy, plan }: { energy: number; plan: DailyPlan | null }) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = React.useState(energy);
  const levels = [
    { v: 0, label: "Admin", border: "#5EE0B0", text: "#5EE0B0" },
    { v: 1, label: "Medium", border: "#7FA6D9", text: "#7FA6D9" },
    { v: 2, label: "Deep", border: "#F0F0EE", text: "#FFFFFF" },
  ];

  async function pick(v: number) {
    setValue(v);
    const r = await saveEnergyLevel(v);
    if (r?.error) toast.show(r.error, "error"); else router.refresh();
  }

  return (
    <section className="rounded-[8px] border border-[#26262B] bg-[#141417] p-5">
      <h3 className="text-base font-semibold">How is your energy?</h3>
      <p className="mt-1.5 text-sm text-[#9C9CA4] leading-[1.5]">
        {plan?.energy_level != null ? "We match tasks to this." : "Three taps. Everything reshapes around the answer."}
      </p>
      <div className="grid grid-cols-3 gap-2 mt-3.5">
        {levels.map((l) => {
          const on = value === l.v;
          return (
            <button key={l.v} onClick={() => pick(l.v)}
              className={cn("py-3 px-1.5 rounded-[6px] text-xs border transition-colors focus-ring",
                on ? "text-[#0B0B0D] font-semibold" : "bg-[#101013] text-[#9C9CA4] hover:text-[#F0F0EE]")}
              style={on ? { background: l.border, borderColor: l.border } : { borderColor: "#26262B" }}>
              {l.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function MitsCard({ mits }: { mits: Task[] }) {
  return (
    <section className="rounded-[8px] border border-[#26262B] bg-[#141417] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Today&apos;s 3 MITs</h3>
        <Link href="/plan" className="text-[#9C9CA4] hover:text-[#F0F0EE] transition-colors focus-ring rounded" aria-label="Edit plan">
          <PencilIcon />
        </Link>
      </div>
      <div className="flex flex-col gap-2.5 mt-3.5">
        {mits.length ? mits.slice(0, 3).map((t, i) => (
          <Link key={t.id} href={`/tasks/${t.id}`} className="flex gap-2.5 items-start text-sm leading-[1.45] hover:text-[#F0F0EE] transition-colors">
            <span className="font-mono text-2xs text-[#F0F0EE] mt-0.5">{String(i + 1).padStart(2, "0")}</span>
            <span className={cn("flex-1", t.completed && "line-through text-[#9C9CA4]")}>{t.title}</span>
          </Link>
        )) : (
          <Link href="/plan" className="text-sm text-[#F0F0EE] font-medium hover:underline">Pick your three →</Link>
        )}
      </div>
    </section>
  );
}

function AntiListCard({ tasks }: { tasks: Task[] }) {
  return (
    <section className="rounded-[8px] border border-[#26262B] bg-[#1B1B1F] p-5">
      <div className="flex items-center gap-2.5">
        <ShieldOffIcon />
        <h3 className="text-base font-semibold">Not doing this week</h3>
      </div>
      <p className="mt-[7px] text-xs text-[#9C9CA4] leading-[1.5]">
        Named on purpose. It stops following you around.
      </p>
      <div className="flex flex-col gap-2.5 mt-3.5">
        {tasks.length ? tasks.map((t) => (
          <div key={t.id}>
            <p className="text-sm text-[#9C9CA4] line-through decoration-[#35353C]">{t.title}</p>
            {t.anti_reason && <p className="mt-0.5 font-mono text-2xs text-[#9C9CA4]">{t.anti_reason}</p>}
          </div>
        )) : (
          <p className="text-xs text-[#9C9CA4]">Nothing parked yet. Name something and it stops chasing you.</p>
        )}
      </div>
    </section>
  );
}

function RitualsCard({ habits, logs, done }: { habits: Habit[]; logs: HabitLog[]; done: number }) {
  return (
    <section className="rounded-[8px] border border-[#26262B] bg-[#141417] p-5">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-base font-semibold">Rituals</h3>
        <span className="font-mono text-2xs text-[#9C9CA4]">{done}/{habits.length}</span>
      </div>
      {habits.length ? habits.slice(0, 4).map((h) => {
        const isDone = logs.some((l) => l.habit_id === h.id && l.done);
        return (
          <div key={h.id} className="flex items-center gap-2.5 py-[7px]">
            <span className="w-[26px] h-[26px] rounded-lg bg-[#1B1B1F] flex items-center justify-center flex-none" style={{ color: isDone ? "#5EE0B0" : "#F0F0EE" }}>
              <FlameSmall />
            </span>
            <span className={cn("flex-1 text-sm", isDone && "text-[#9C9CA4] line-through")}>{h.name}</span>
          </div>
        );
      }) : (
        <Link href="/habits" className="text-sm text-[#F0F0EE] font-medium hover:underline">Add a ritual →</Link>
      )}
    </section>
  );
}

/* ── Icons ── */
const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function PlayIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z"/></svg>; }
function HourglassIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" {...ic} style={{ color: "#FF8A4C" }}><path d="M5 22h14M5 2h14M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22M7 2v4.2c0 .5.2 1 .6 1.4L12 12l4.4-4.4c.4-.4.6-.9.6-1.4V2"/></svg>; }
function PencilIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" {...ic}><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>; }
function ShieldOffIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" {...ic} style={{ color: "#6E6E77" }}><path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3z"/><path d="M2 2l20 20"/></svg>; }
function FlameSmall() { return <svg width="14" height="14" viewBox="0 0 24 24" {...ic}><path d="M12 22c3.9 0 6.5-2.6 6.5-6 0-4-3.5-5.5-3-9.5C13 8 12 10 12 10S10.5 8 9 6C7 8.5 5.5 10.5 5.5 16c0 3.4 2.6 6 6.5 6z"/></svg>; }
