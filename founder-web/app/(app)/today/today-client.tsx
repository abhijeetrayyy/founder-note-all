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
 * Today, built to `FounderOS App v2.dc.html`.
 *
 * Two columns at 1.55fr / 1fr. Left: the one thing on ink, capacity, the
 * rotting shelf, then the day's list. Right: energy check-in, the three MITs,
 * the anti-list on #F1EDE3, and rituals. Measures, radii and type sizes are the
 * handoff's, wired to real data.
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

          <div className="rounded-[18px] border border-[#E6DFD2] bg-[#FFFDF8] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#EFE9DD] flex items-center justify-between">
              <h3 className="text-base font-semibold">Today · {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}</h3>
              <span className="font-mono text-2xs text-[#6B6459]">{doneCount} done</span>
            </div>
            {dayTasks.length ? dayTasks.map((t) => <TaskRow key={t.id} task={t} />) : (
              <p className="px-5 py-6 text-sm text-[#605A50]">Nothing committed to today yet.</p>
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
      <section className="rounded-[20px] bg-[#171512] text-[#FBF8F2] p-[30px] animate-rise">
        <p className="font-mono text-2xs tracking-[0.14em] uppercase text-[#4FCBB6]">Closed</p>
        <h2 className="mt-3 font-display text-4xl leading-[1.1] line-through decoration-[#4A453C] decoration-1">
          {task.title}
        </h2>
        <p className="mt-4 text-base text-[#B3AB9C] animate-rise delay-2">
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
    <section className="rounded-[20px] bg-[#171512] text-[#FBF8F2] p-[30px] relative overflow-hidden">
      <p className="font-mono text-2xs tracking-[0.14em] uppercase text-[#8B8272]">
        The one thing · matched to {energyLabel(energy as 0 | 1 | 2)} energy
      </p>

      <Link href={`/tasks/${task.id}`} className="block group">
        <h2 className="font-display text-4xl leading-[1.1] tracking-[-0.015em] mt-3.5 group-hover:text-[#A79DFF] transition-colors">
          {task.title}
        </h2>
      </Link>

      <div className="flex flex-wrap gap-2 mt-4">
        <span className="text-xs text-[#A79DFF] border border-[#3A3550] px-2.5 py-[5px] rounded-lg">
          {energyLabel(task.energy_level as 0 | 1 | 2)}
        </span>
        {task.priority === 2 && (
          <span className="text-xs text-[#F0B25E] border border-[#4A3D2A] px-2.5 py-[5px] rounded-lg">High priority</span>
        )}
        {task.due_date && (
          <span className="text-xs text-[#B3AB9C] border border-[#302C25] px-2.5 py-[5px] rounded-lg">Due today</span>
        )}
      </div>

      <div className="mt-5 p-4 rounded-[13px] bg-[#201D18] border border-[#302C25]">
        <p className="font-mono text-2xs tracking-[0.12em] uppercase text-[#9C9384]">First micro-step</p>
        <p className="mt-2 text-base text-[#E7E1D6]">{move}</p>
      </div>

      <div className="flex gap-2.5 mt-5 flex-wrap">
        <Link href={`/focus?task=${task.id}`}
          className="rounded-[11px] bg-[#5B4FE9] hover:bg-[#6E63FF] text-white text-base font-semibold px-[18px] py-3 flex items-center gap-2 transition-colors focus-ring">
          <PlayIcon /> Start focus · {minutes}m
        </Link>
        <button onClick={complete}
          className="rounded-[11px] border border-[#3A362F] hover:border-[#8B8272] text-[#E7E1D6] text-base px-4 py-3 transition-colors focus-ring">
          Mark done
        </button>
        <Link href="/loops"
          className="rounded-[11px] border border-[#3A362F] hover:border-[#8B8272] text-[#E7E1D6] text-base px-4 py-3 transition-colors focus-ring">
          Not now, show another
        </Link>
      </div>
    </section>
  );
}

function NoPlanCard() {
  return (
    <section className="rounded-[20px] bg-[#171512] text-[#FBF8F2] p-[30px]">
      <p className="font-mono text-2xs tracking-[0.14em] uppercase text-[#8B8272]">The one thing</p>
      <h2 className="font-display text-4xl leading-[1.1] tracking-[-0.015em] mt-3.5">Nothing is chosen yet.</h2>
      <p className="mt-3 text-base text-[#B3AB9C] max-w-md">
        Sixty guided seconds replace twenty minutes of deciding.
      </p>
      <Link href="/plan"
        className="mt-5 inline-flex rounded-[11px] bg-[#5B4FE9] hover:bg-[#6E63FF] text-white text-base font-semibold px-[18px] py-3 items-center gap-2 transition-colors focus-ring">
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
    <p className="mb-5 text-base text-[#6B6459] animate-rise">
      <span className="text-[#0E8C7E]">●</span> {line}
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
      className="group rounded-[18px] border border-[#E6DFD2] bg-[#FFFDF8] p-[22px] flex items-center gap-4 hover:border-[#C9C0B0] transition-colors focus-ring">
      <div className="flex-1">
        <h3 className="text-base font-semibold">
          You are waiting on {count} {count === 1 ? "person" : "people"}
        </h3>
        <p className="mt-1.5 text-sm text-[#605A50] leading-[1.5]">
          Thirty seconds to move {count === 1 ? "it" : "them all"} into someone else&apos;s court.
          The drafts are already written.
        </p>
      </div>
      <span className="text-[#8A8378] group-hover:text-[#5B4FE9] transition-colors">→</span>
    </Link>
  );
}

/* ── Capacity ── */
function CapacityCard({ fit }: { fit: ReturnType<typeof capacityFit> }) {
  const lanes = [
    { k: "deep" as const, label: "Deep", color: "#5B4FE9" },
    { k: "medium" as const, label: "Medium", color: "#3B82F6" },
    { k: "admin" as const, label: "Admin", color: "#14B8A6" },
  ];
  return (
    <section className="rounded-[18px] border border-[#E6DFD2] bg-[#FFFDF8] p-[22px]">
      <div className="flex items-baseline justify-between gap-3.5">
        <h3 className="text-base font-semibold">Today&apos;s capacity</h3>
        <span className="font-mono text-2xs text-[#6B6459]">
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
                <span className="font-mono text-2xs text-[#605A50]">{used} of {total} used</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: Math.max(total, used) }, (_, i) => (
                  <span key={i} className="flex-1 h-2 rounded-full"
                    style={{ background: i >= total ? "#D9552F" : i < used ? l.color : "#E7E0D2" }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {fit.advice && <p className="mt-3.5 text-xs text-[#8A6553]">{fit.advice}</p>}
    </section>
  );
}

/* ── Rotting ── */
function RottingCard({ loops }: { loops: Task[] }) {
  return (
    <section className="rounded-[18px] border border-[#F0D3C6] bg-[#FDF6F2] p-[22px]">
      <div className="flex items-center gap-2.5">
        <HourglassIcon />
        <h3 className="text-base font-semibold">
          {loops.length} {loops.length === 1 ? "loop is" : "loops are"} rotting
        </h3>
      </div>
      <p className="mt-2 text-sm text-[#8A6553] leading-[1.5]">
        Answer each one: do it, schedule it, hand it off, or drop it. Ninety seconds and the pressure drops.
      </p>
      <div className="flex flex-col gap-2.5 mt-3.5">
        {loops.slice(0, 4).map((t) => {
          const age = loopAge(t);
          const hot = decayTone(t) === "rotting";
          return (
            <Link key={t.id} href={`/tasks/${t.id}`}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-[#FFFDF8] border border-[#F0D3C6] hover:border-[#D9552F] transition-colors">
              <span className="flex-1 text-base leading-[1.4]">{t.title}</span>
              <span className="font-mono text-2xs" style={{ color: hot ? "#D9552F" : "#B07C15" }}>
                {age} days
              </span>
            </Link>
          );
        })}
      </div>
      <Link href="/loops?filter=rotting"
        className="mt-3.5 inline-flex rounded-[11px] bg-[#171512] hover:bg-[#D9552F] text-[#FBF8F2] text-sm font-medium px-[17px] py-[11px] transition-colors focus-ring">
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
  const tint: Record<number, string> = { 0: "#14B8A6", 1: "#3B82F6", 2: "#5B4FE9" };
  const ink: Record<number, string> = { 0: "#0E6B60", 1: "#2E6BD0", 2: "#4A3EDA" };
  const c = tint[task.energy_level] ?? "#3B82F6";
  const fg = ink[task.energy_level] ?? "#2E6BD0";

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
      className={cn(
        "flex items-center gap-[13px] px-5 py-3.5 border-b border-[#F2ECE1] last:border-b-0 hover:bg-[#FBF8F2] transition-colors",
        done && !task.completed && "animate-settle",
      )}>
      <button onClick={toggle} aria-label={done ? "Mark not done" : "Mark done"}
        className={cn("w-[19px] h-[19px] rounded-md flex-none flex items-center justify-center transition-colors focus-ring",
          done ? "bg-[#5B4FE9] text-white" : "border-[1.5px] border-[#D8D0C0] text-transparent")}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"
          className={done ? "check-draw" : undefined}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-base", done ? "text-[#6B6459] line-through" : "font-medium")}>{task.title}</p>
        {task.first_step && <p className="mt-[3px] text-xs text-[#6B6459] truncate">{task.first_step}</p>}
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
    { v: 0, label: "Admin", border: "#14B8A6", text: "#0E8C7E" },
    { v: 1, label: "Medium", border: "#3B82F6", text: "#2E6BD0" },
    { v: 2, label: "Deep", border: "#5B4FE9", text: "#4A3EDA" },
  ];

  async function pick(v: number) {
    setValue(v);
    const r = await saveEnergyLevel(v);
    if (r?.error) toast.show(r.error, "error"); else router.refresh();
  }

  return (
    <section className="rounded-[18px] border border-[#E6DFD2] bg-[#FFFDF8] p-5">
      <h3 className="text-base font-semibold">How is your energy?</h3>
      <p className="mt-1.5 text-sm text-[#605A50] leading-[1.5]">
        {plan?.energy_level != null ? "We match tasks to this." : "Three taps. Everything reshapes around the answer."}
      </p>
      <div className="grid grid-cols-3 gap-2 mt-3.5">
        {levels.map((l) => {
          const on = value === l.v;
          return (
            <button key={l.v} onClick={() => pick(l.v)}
              className={cn("py-3 px-1.5 rounded-[11px] text-xs border transition-colors focus-ring",
                on ? "text-white font-semibold" : "bg-[#FBF8F2] text-[#6B6459] hover:text-[#171512]")}
              style={on ? { background: l.border, borderColor: l.border } : { borderColor: "#E0D9CB" }}>
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
    <section className="rounded-[18px] border border-[#E6DFD2] bg-[#FFFDF8] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Today&apos;s 3 MITs</h3>
        <Link href="/plan" className="text-[#6B6459] hover:text-[#5B4FE9] transition-colors focus-ring rounded" aria-label="Edit plan">
          <PencilIcon />
        </Link>
      </div>
      <div className="flex flex-col gap-2.5 mt-3.5">
        {mits.length ? mits.slice(0, 3).map((t, i) => (
          <Link key={t.id} href={`/tasks/${t.id}`} className="flex gap-2.5 items-start text-sm leading-[1.45] hover:text-[#5B4FE9] transition-colors">
            <span className="font-mono text-2xs text-[#5B4FE9] mt-0.5">{String(i + 1).padStart(2, "0")}</span>
            <span className={cn("flex-1", t.completed && "line-through text-[#6B6459]")}>{t.title}</span>
          </Link>
        )) : (
          <Link href="/plan" className="text-sm text-[#5B4FE9] font-medium hover:underline">Pick your three →</Link>
        )}
      </div>
    </section>
  );
}

function AntiListCard({ tasks }: { tasks: Task[] }) {
  return (
    <section className="rounded-[18px] border border-[#E6DFD2] bg-[#F1EDE3] p-5">
      <div className="flex items-center gap-2.5">
        <ShieldOffIcon />
        <h3 className="text-base font-semibold">Not doing this week</h3>
      </div>
      <p className="mt-[7px] text-xs text-[#605A50] leading-[1.5]">
        Named on purpose. It stops following you around.
      </p>
      <div className="flex flex-col gap-2.5 mt-3.5">
        {tasks.length ? tasks.map((t) => (
          <div key={t.id}>
            <p className="text-sm text-[#57514A] line-through decoration-[#C4BCAC]">{t.title}</p>
            {t.anti_reason && <p className="mt-0.5 font-mono text-2xs text-[#6B6459]">{t.anti_reason}</p>}
          </div>
        )) : (
          <p className="text-xs text-[#6B6459]">Nothing parked yet. Name something and it stops chasing you.</p>
        )}
      </div>
    </section>
  );
}

function RitualsCard({ habits, logs, done }: { habits: Habit[]; logs: HabitLog[]; done: number }) {
  return (
    <section className="rounded-[18px] border border-[#E6DFD2] bg-[#FFFDF8] p-5">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-base font-semibold">Rituals</h3>
        <span className="font-mono text-2xs text-[#6B6459]">{done}/{habits.length}</span>
      </div>
      {habits.length ? habits.slice(0, 4).map((h) => {
        const isDone = logs.some((l) => l.habit_id === h.id && l.done);
        return (
          <div key={h.id} className="flex items-center gap-2.5 py-[7px]">
            <span className="w-[26px] h-[26px] rounded-lg bg-[#F1EDE3] flex items-center justify-center flex-none" style={{ color: isDone ? "#0E8C7E" : "#5B4FE9" }}>
              <FlameSmall />
            </span>
            <span className={cn("flex-1 text-sm", isDone && "text-[#6B6459] line-through")}>{h.name}</span>
          </div>
        );
      }) : (
        <Link href="/habits" className="text-sm text-[#5B4FE9] font-medium hover:underline">Add a ritual →</Link>
      )}
    </section>
  );
}

/* ── Icons ── */
const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function PlayIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z"/></svg>; }
function HourglassIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" {...ic} style={{ color: "#D9552F" }}><path d="M5 22h14M5 2h14M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22M7 2v4.2c0 .5.2 1 .6 1.4L12 12l4.4-4.4c.4-.4.6-.9.6-1.4V2"/></svg>; }
function PencilIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" {...ic}><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>; }
function ShieldOffIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" {...ic} style={{ color: "#8A8378" }}><path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3z"/><path d="M2 2l20 20"/></svg>; }
function FlameSmall() { return <svg width="14" height="14" viewBox="0 0 24 24" {...ic}><path d="M12 22c3.9 0 6.5-2.6 6.5-6 0-4-3.5-5.5-3-9.5C13 8 12 10 12 10S10.5 8 9 6C7 8.5 5.5 10.5 5.5 16c0 3.4 2.6 6 6.5 6z"/></svg>; }
