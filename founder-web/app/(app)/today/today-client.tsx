"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toggleTask } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Meter } from "@/components/ui/card";
import { InlineCapture } from "@/components/inline-capture";
import { HeroTask } from "@/components/hero-task";
import type { Task, Note, Goal, Habit, HabitLog, DailyPlan } from "@/lib/supabase/types";

const HOUR = new Date().getHours();
const PHASE = HOUR < 12 ? "Morning" : HOUR < 18 ? "Afternoon" : "Evening";

const GREETINGS: Record<string, string> = {
  Morning: "Good morning",
  Afternoon: "Good afternoon",
  Evening: "Good evening",
};

export function TodayClient({
  name, energy: _energy, plan, mits, restTasks, habits, habitLogs, goals, notes, summary,
}: {
  name: string | null; energy: number; plan: DailyPlan | null;
  mits: Task[]; restTasks: Task[]; habits: Habit[]; habitLogs: HabitLog[]; goals: Goal[]; notes: Note[];
  summary: { inbox_count: number; due_today_count: number; completed_today_count: number; habits_done_today: number };
}) {
  const router = useRouter();
  const toast = useToast();
  const displayName = name?.split(" ")[0] ?? "founder";
  const allMitsDone = mits.length > 0 && mits.every(t => t.completed);
  const activeMits = mits.filter(t => !t.completed);
  const completionRate = mits.length ? mits.filter(t => t.completed).length / mits.length : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* ── Greeting ── */}
      <header className="space-y-1">
        <p className="text-xs text-foreground-subtle uppercase tracking-[0.2em] font-semibold">{PHASE}</p>
        <h1 className="text-hero text-foreground font-display">
          {GREETINGS[PHASE]}, {displayName}
        </h1>
        {plan?.intention_text && (
          <p className="text-base text-foreground-muted italic mt-2 max-w-xl">"{plan.intention_text}"</p>
        )}
      </header>

      {/* ── Day Won State ── */}
      {allMitsDone && <DayWonBanner name={displayName} count={summary.completed_today_count} />}

      {/* ── Persistent capture ── */}
      {!allMitsDone && (
        <div className="animate-slide-up">
          <InlineCapture />
        </div>
      )}

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/inbox" className="flex flex-col gap-1 p-4 rounded-2xl glass-ambient hover:glass-active transition-all duration-300">
          <span className="text-2xs uppercase tracking-wider text-foreground-subtle font-bold">Inbox</span>
          <span className={cn("text-metric-sm text-foreground number-mono", summary.inbox_count > 5 && "text-state-attention")}>{summary.inbox_count}</span>
        </Link>
        <Link href="/stats" className="flex flex-col gap-1 p-4 rounded-2xl glass-ambient hover:glass-active transition-all duration-300">
          <span className="text-2xs uppercase tracking-wider text-foreground-subtle font-bold">Done today</span>
          <span className="text-metric-sm text-state-done number-mono">{summary.completed_today_count}</span>
        </Link>
        <div className="flex flex-col gap-1 p-4 rounded-2xl glass-ambient">
          <span className="text-2xs uppercase tracking-wider text-foreground-subtle font-bold">Habits</span>
          <span className="text-metric-sm text-accent number-mono">{summary.habits_done_today}/{habits.length}</span>
        </div>
        <div className="flex flex-col gap-1 p-4 rounded-2xl glass-ambient">
          <span className="text-2xs uppercase tracking-wider text-foreground-subtle font-bold">Momentum</span>
          <div className="flex items-center gap-2">
            <Meter value={completionRate} size={36} strokeWidth={4} />
            <span className="text-metric-sm text-foreground number-mono">{Math.round(completionRate * 100)}%</span>
          </div>
        </div>
      </div>

      {/* ── Hero MIT ── */}
      {mits.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-2xs uppercase tracking-[0.2em] text-foreground-subtle font-bold">Now</p>
            <Link href="/plan" className="text-xs font-semibold text-accent hover:text-accent-glow transition-colors">Plan day →</Link>
          </div>
          <div className="space-y-3">
            {activeMits.map((task, i) => (
              <HeroTask key={task.id} task={task} index={i} total={mits.length} />
            ))}
            {mits.filter(t => t.completed).map((task) => (
              <HeroTask key={task.id} task={task} index={mits.indexOf(task)} total={mits.length} />
            ))}
          </div>
        </section>
      )}

      {/* ── Empty MIT state ── */}
      {mits.length === 0 && !allMitsDone && (
        <Link href="/plan" className="block p-8 rounded-2xl glass-ambient border-dashed text-center hover:glass-active transition-all duration-300 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-accent-muted flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">What deserves your attention today?</h3>
          <p className="text-sm text-foreground-muted mb-4 max-w-md mx-auto">Pick 1–3 things that matter most. Everything else can wait.</p>
          <span className="inline-block h-11 px-5 rounded-xl bg-accent-muted text-accent font-semibold text-sm hover:bg-accent-muted-strong transition-colors">Plan your day →</span>
        </Link>
      )}

      {/* ── Rest tasks ── */}
      {restTasks.length > 0 && !allMitsDone && (
        <section className="space-y-3">
          <p className="text-2xs uppercase tracking-[0.2em] text-foreground-subtle font-bold">Later today</p>
          <div className="space-y-1">
            {restTasks.map((task) => <TaskRow key={task.id} task={task} />)}
          </div>
        </section>
      )}

      {/* ── Bento: Habits + Goals + Notes ── */}
      {!allMitsDone && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Habits */}
          <div className="p-5 rounded-2xl glass-ambient space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-2xs uppercase tracking-wider text-foreground-subtle font-bold">Rituals</p>
              <Link href="/habits" className="text-xs text-foreground-muted hover:text-foreground transition-colors">All →</Link>
            </div>
            {habits.length ? habits.slice(0, 5).map((h) => {
              const log = habitLogs.find((l) => l.habit_id === h.id);
              return <HabitRow key={h.id} habit={h} done={!!log?.done} />;
            }) : (
              <p className="text-sm text-foreground-muted italic">No rituals yet</p>
            )}
          </div>

          {/* Goals */}
          <div className="p-5 rounded-2xl glass-ambient space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-2xs uppercase tracking-wider text-foreground-subtle font-bold">North star</p>
              <Link href="/goals" className="text-xs text-foreground-muted hover:text-foreground transition-colors">All →</Link>
            </div>
            {goals.length ? goals.slice(0, 3).map((g) => <GoalRow key={g.id} goal={g} />) : (
              <Link href="/goals" className="block text-sm text-accent font-semibold hover:underline">Set a goal →</Link>
            )}
          </div>

          {/* Notes */}
          <div className="p-5 rounded-2xl glass-ambient space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-2xs uppercase tracking-wider text-foreground-subtle font-bold">Thoughts</p>
              <Link href="/notes" className="text-xs text-foreground-muted hover:text-foreground transition-colors">All →</Link>
            </div>
            {notes.length ? notes.slice(0, 3).map((n) => <NoteRow key={n.id} note={n} />) : (
              <p className="text-sm text-foreground-muted italic">Capture a thought above</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Day Won Banner ── */
function DayWonBanner({ name, count }: { name: string; count: number }) {
  return (
    <div className="p-8 rounded-card glass-focused text-center animate-scale-in">
      <div className="w-16 h-16 rounded-full bg-state-done/10 flex items-center justify-center mx-auto mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
      </div>
      <h2 className="text-2xl font-bold text-foreground font-display mb-2">Day won, {name}.</h2>
      <p className="text-sm text-foreground-muted mb-1">You shipped everything you committed to.</p>
      <p className="text-xs text-foreground-subtle">{count} tasks completed today · Rest earned.</p>
    </div>
  );
}

/* ── Sub-components ── */

function TaskRow({ task }: { task: Task }) {
  const router = useRouter(); const toast = useToast();
  const [done, setDone] = React.useState(task.completed);
  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    const r = await toggleTask(task.id, !done);
    if (r.error) toast.show(r.error, "error");
    else { const was = done; setDone(!was); if (!was) toast.show("Done!", "success"); setTimeout(() => router.refresh(), 800); }
  }
  return (
    <Link href={`/tasks/${task.id}`} className={cn("flex items-center gap-3 p-3 rounded-xl transition-all duration-500 group", done ? "opacity-50" : "hover:glass-active")}>
      <button onClick={toggle} className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300", done ? "bg-state-done border-state-done" : "border-foreground-faint group-hover:border-accent/40")}>
        {done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>}
      </button>
      <p className={cn("text-sm flex-1", done && "line-through text-foreground-subtle")}>{task.title}</p>
    </Link>
  );
}

function HabitRow({ habit, done }: { habit: Habit; done: boolean }) {
  const router = useRouter(); const toast = useToast();
  async function toggle(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    const { toggleHabit } = await import("@/lib/actions");
    const r = await toggleHabit(habit.id);
    if (r.error) toast.show(r.error, "error"); else router.refresh();
  }
  return (
    <button onClick={toggle} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors group">
      <div className={cn("w-2.5 h-2.5 rounded-full transition-all duration-300", done ? "bg-state-done shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-foreground-faint group-hover:bg-accent/40")} />
      <span className={cn("text-sm flex-1 text-left", done ? "line-through text-foreground-subtle" : "text-foreground-muted")}>{habit.name}</span>
    </button>
  );
}

function GoalRow({ goal }: { goal: Goal }) {
  const color = goal.progress >= 75 ? "var(--color-state-done)" : goal.progress >= 50 ? "var(--color-state-attention)" : "var(--color-accent)";
  return (
    <Link href="/goals" className="block p-3 rounded-xl glass-ambient hover:glass-active transition-all duration-300">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-foreground-muted truncate">{goal.title}</span>
        <span className="text-xs font-bold number-mono text-state-done">{goal.progress}%</span>
      </div>
      <div className="h-1 rounded-full bg-base-overlay overflow-hidden"><div className="h-full rounded-full bg-state-done transition-all duration-700" style={{ width: `${goal.progress}%` }} /></div>
    </Link>
  );
}

function NoteRow({ note }: { note: Note }) {
  return (
    <Link href={`/notes/${note.id}`} className="block p-3 rounded-xl glass-ambient hover:glass-active transition-all duration-300">
      <p className="text-sm font-medium text-foreground-muted line-clamp-1">{note.title || "Untitled"}</p>
      {note.content && <p className="text-xs text-foreground-subtle line-clamp-2 mt-0.5">{note.content}</p>}
    </Link>
  );
}
