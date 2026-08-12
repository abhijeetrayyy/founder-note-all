"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toggleTask, saveEnergyLevel } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { InlineCapture } from "@/components/inline-capture";
import { EMPTY_PRESSURE, capacityFit, draftNextMove, decayTone, loopAge, type Pressure } from "@/lib/loops";
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
  name: _name, summary, pressure = EMPTY_PRESSURE, antiList = [],
}: {
  name: string | null; energy: number; plan: DailyPlan | null;
  mits: Task[]; restTasks: Task[]; habits: Habit[]; habitLogs: HabitLog[]; goals: Goal[]; notes: Note[];
  summary: { inbox_count: number; due_today_count: number; completed_today_count: number; habits_done_today: number };
  pressure?: Pressure; antiList?: Task[];
}) {
  const activeMits = mits.filter((t) => !t.completed);
  const openRest = restTasks.filter((t) => !t.completed);
  const one = activeMits[0] ?? openRest[0] ?? null;
  const dayTasks = [...mits, ...restTasks];
  const doneCount = dayTasks.filter((t) => t.completed).length;
  const capacity = capacityFit(dayTasks);
  const rotting = [...mits, ...restTasks].filter((t) => decayTone(t) !== "fresh");

  return (
    <div className="flex-1 w-full max-w-[1180px] mx-auto px-5 sm:px-7 pt-7 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-[22px] items-start">
        {/* ── Left ── */}
        <div className="flex flex-col gap-5">
          {one ? <OneThing task={one} energy={energy} /> : <NoPlanCard />}

          <CapacityCard fit={capacity} />

          {rotting.length > 0 && <RottingCard loops={rotting} />}

          <div className="rounded-[18px] border border-[#E6DFD2] bg-[#FFFDF8] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#EFE9DD] flex items-center justify-between">
              <h3 className="text-[14.5px] font-semibold">Today · {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}</h3>
              <span className="font-mono text-[11px] text-[#9A9285]">{doneCount} done</span>
            </div>
            {dayTasks.length ? dayTasks.map((t) => <TaskRow key={t.id} task={t} />) : (
              <p className="px-5 py-6 text-[13.5px] text-[#8A8378]">Nothing committed to today yet.</p>
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

  async function complete() {
    setDone(true);
    const r = await toggleTask(task.id, true);
    if (r.error) { toast.show(r.error, "error"); setDone(false); return; }
    setTimeout(() => router.refresh(), 500);
  }

  return (
    <section className={cn("rounded-[20px] bg-[#171512] text-[#FBF8F2] p-[30px] relative overflow-hidden transition-opacity", done && "opacity-40")}>
      <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#8B8272]">
        The one thing · matched to {energyLabel(energy as 0 | 1 | 2)} energy
      </p>

      <Link href={`/tasks/${task.id}`} className="block group">
        <h2 className="font-display text-[36px] leading-[1.1] tracking-[-0.015em] mt-3.5 group-hover:text-[#A79DFF] transition-colors">
          {task.title}
        </h2>
      </Link>

      <div className="flex flex-wrap gap-2 mt-4">
        <span className="text-[12px] text-[#A79DFF] border border-[#3A3550] px-2.5 py-[5px] rounded-lg">
          {energyLabel(task.energy_level as 0 | 1 | 2)}
        </span>
        {task.priority === 2 && (
          <span className="text-[12px] text-[#F0B25E] border border-[#4A3D2A] px-2.5 py-[5px] rounded-lg">High priority</span>
        )}
        {task.due_date && (
          <span className="text-[12px] text-[#B3AB9C] border border-[#302C25] px-2.5 py-[5px] rounded-lg">Due today</span>
        )}
      </div>

      <div className="mt-5 p-4 rounded-[13px] bg-[#201D18] border border-[#302C25]">
        <p className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-[#8B8272]">First micro-step</p>
        <p className="mt-2 text-[15px] text-[#E7E1D6]">{move}</p>
      </div>

      <div className="flex gap-2.5 mt-5 flex-wrap">
        <Link href={`/focus?task=${task.id}`}
          className="rounded-[11px] bg-[#5B4FE9] hover:bg-[#6E63FF] text-white text-[14px] font-semibold px-[18px] py-3 flex items-center gap-2 transition-colors focus-ring">
          <PlayIcon /> Start focus · {minutes}m
        </Link>
        <button onClick={complete} disabled={done}
          className="rounded-[11px] border border-[#3A362F] hover:border-[#8B8272] text-[#E7E1D6] text-[14px] px-4 py-3 transition-colors focus-ring disabled:opacity-50">
          {done ? "Done" : "Mark done"}
        </button>
        <Link href="/loops"
          className="rounded-[11px] border border-[#3A362F] hover:border-[#8B8272] text-[#E7E1D6] text-[14px] px-4 py-3 transition-colors focus-ring">
          Not now, show another
        </Link>
      </div>
    </section>
  );
}

function NoPlanCard() {
  return (
    <section className="rounded-[20px] bg-[#171512] text-[#FBF8F2] p-[30px]">
      <p className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#8B8272]">The one thing</p>
      <h2 className="font-display text-[36px] leading-[1.1] tracking-[-0.015em] mt-3.5">Nothing is chosen yet.</h2>
      <p className="mt-3 text-[15px] text-[#B3AB9C] max-w-md">
        Sixty guided seconds replace twenty minutes of deciding.
      </p>
      <Link href="/plan"
        className="mt-5 inline-flex rounded-[11px] bg-[#5B4FE9] hover:bg-[#6E63FF] text-white text-[14px] font-semibold px-[18px] py-3 items-center gap-2 transition-colors focus-ring">
        Plan the day · 60s
      </Link>
    </section>
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
        <h3 className="text-[14.5px] font-semibold">Today&apos;s capacity</h3>
        <span className="font-mono text-[11px] text-[#9A9285]">
          {fit.advice ? "over budget" : "what a day of yours holds"}
        </span>
      </div>
      <div className="flex flex-col gap-3.5 mt-4">
        {lanes.map((l) => {
          const used = fit.used[l.k], total = fit.limit[l.k];
          return (
            <div key={l.k}>
              <div className="flex justify-between text-[12.5px] mb-1.5">
                <span className="font-medium">{l.label}</span>
                <span className="font-mono text-[11px] text-[#8A8378]">{used} of {total} used</span>
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
      {fit.advice && <p className="mt-3.5 text-[12.5px] text-[#8A6553]">{fit.advice}</p>}
    </section>
  );
}

/* ── Rotting ── */
function RottingCard({ loops }: { loops: Task[] }) {
  return (
    <section className="rounded-[18px] border border-[#F0D3C6] bg-[#FDF6F2] p-[22px]">
      <div className="flex items-center gap-2.5">
        <HourglassIcon />
        <h3 className="text-[14.5px] font-semibold">
          {loops.length} {loops.length === 1 ? "loop is" : "loops are"} rotting
        </h3>
      </div>
      <p className="mt-2 text-[13.5px] text-[#8A6553] leading-[1.5]">
        Answer each one: do it, schedule it, hand it off, or drop it. Ninety seconds and the pressure drops.
      </p>
      <div className="flex flex-col gap-2.5 mt-3.5">
        {loops.slice(0, 4).map((t) => {
          const age = loopAge(t);
          const hot = decayTone(t) === "rotting";
          return (
            <Link key={t.id} href={`/tasks/${t.id}`}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-[#FFFDF8] border border-[#F0D3C6] hover:border-[#D9552F] transition-colors">
              <span className="flex-1 text-[14px] leading-[1.4]">{t.title}</span>
              <span className="font-mono text-[11.5px]" style={{ color: hot ? "#D9552F" : "#B07C15" }}>
                {age} days
              </span>
            </Link>
          );
        })}
      </div>
      <Link href="/loops?filter=rotting"
        className="mt-3.5 inline-flex rounded-[11px] bg-[#171512] hover:bg-[#D9552F] text-[#FBF8F2] text-[13.5px] font-medium px-[17px] py-[11px] transition-colors focus-ring">
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
  const tint: Record<number, string> = { 0: "#14B8A6", 1: "#3B82F6", 2: "#5B4FE9" };
  const c = tint[task.energy_level] ?? "#3B82F6";

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    const r = await toggleTask(task.id, !done);
    if (r.error) { toast.show(r.error, "error"); return; }
    setDone(!done);
    setTimeout(() => router.refresh(), 600);
  }

  return (
    <Link href={`/tasks/${task.id}`} className="flex items-center gap-[13px] px-5 py-3.5 border-b border-[#F2ECE1] last:border-b-0 hover:bg-[#FBF8F2] transition-colors">
      <button onClick={toggle} aria-label={done ? "Mark not done" : "Mark done"}
        className={cn("w-[19px] h-[19px] rounded-md flex-none flex items-center justify-center transition-colors focus-ring",
          done ? "bg-[#5B4FE9] text-white" : "border-[1.5px] border-[#D8D0C0] text-transparent")}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M20 6 9 17l-5-5"/></svg>
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-[14.5px]", done ? "text-[#A69E90] line-through" : "font-medium")}>{task.title}</p>
        {task.first_step && <p className="mt-[3px] text-[12px] text-[#9A9285] truncate">{task.first_step}</p>}
      </div>
      <span className="flex-none text-[11px] font-medium px-2.5 py-1 rounded-md" style={{ color: c, background: `${c}14` }}>
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
      <h3 className="text-[14.5px] font-semibold">How is your energy?</h3>
      <p className="mt-1.5 text-[13px] text-[#8A8378] leading-[1.5]">
        {plan?.energy_level != null ? "We match tasks to this." : "Three taps. Everything reshapes around the answer."}
      </p>
      <div className="grid grid-cols-3 gap-2 mt-3.5">
        {levels.map((l) => {
          const on = value === l.v;
          return (
            <button key={l.v} onClick={() => pick(l.v)}
              className={cn("py-3 px-1.5 rounded-[11px] text-[12.5px] border transition-colors focus-ring",
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
        <h3 className="text-[14.5px] font-semibold">Today&apos;s 3 MITs</h3>
        <Link href="/plan" className="text-[#A69E90] hover:text-[#5B4FE9] transition-colors focus-ring rounded" aria-label="Edit plan">
          <PencilIcon />
        </Link>
      </div>
      <div className="flex flex-col gap-2.5 mt-3.5">
        {mits.length ? mits.slice(0, 3).map((t, i) => (
          <Link key={t.id} href={`/tasks/${t.id}`} className="flex gap-2.5 items-start text-[13.5px] leading-[1.45] hover:text-[#5B4FE9] transition-colors">
            <span className="font-mono text-[11px] text-[#5B4FE9] mt-0.5">{String(i + 1).padStart(2, "0")}</span>
            <span className={cn("flex-1", t.completed && "line-through text-[#A69E90]")}>{t.title}</span>
          </Link>
        )) : (
          <Link href="/plan" className="text-[13.5px] text-[#5B4FE9] font-medium hover:underline">Pick your three →</Link>
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
        <h3 className="text-[14.5px] font-semibold">Not doing this week</h3>
      </div>
      <p className="mt-[7px] text-[12.5px] text-[#8A8378] leading-[1.5]">
        Named on purpose. It stops following you around.
      </p>
      <div className="flex flex-col gap-2.5 mt-3.5">
        {tasks.length ? tasks.map((t) => (
          <div key={t.id}>
            <p className="text-[13.5px] text-[#57514A] line-through decoration-[#C4BCAC]">{t.title}</p>
            {t.anti_reason && <p className="mt-0.5 font-mono text-[10.5px] text-[#A69E90]">{t.anti_reason}</p>}
          </div>
        )) : (
          <p className="text-[12.5px] text-[#A69E90]">Nothing parked yet. Name something and it stops chasing you.</p>
        )}
      </div>
    </section>
  );
}

function RitualsCard({ habits, logs, done }: { habits: Habit[]; logs: HabitLog[]; done: number }) {
  return (
    <section className="rounded-[18px] border border-[#E6DFD2] bg-[#FFFDF8] p-5">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-[14.5px] font-semibold">Rituals</h3>
        <span className="font-mono text-[11px] text-[#9A9285]">{done}/{habits.length}</span>
      </div>
      {habits.length ? habits.slice(0, 4).map((h) => {
        const isDone = logs.some((l) => l.habit_id === h.id && l.done);
        return (
          <div key={h.id} className="flex items-center gap-2.5 py-[7px]">
            <span className="w-[26px] h-[26px] rounded-lg bg-[#F1EDE3] flex items-center justify-center flex-none" style={{ color: isDone ? "#0E8C7E" : "#5B4FE9" }}>
              <FlameSmall />
            </span>
            <span className={cn("flex-1 text-[13.5px]", isDone && "text-[#A69E90] line-through")}>{h.name}</span>
          </div>
        );
      }) : (
        <Link href="/habits" className="text-[13.5px] text-[#5B4FE9] font-medium hover:underline">Add a ritual →</Link>
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
