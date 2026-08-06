"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { saveFocusSession } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import type { Task } from "@/lib/supabase/types";

const MODES = [
  { label: "Deep work", minutes: 50, desc: "Sustained focus", key: "deep" },
  { label: "Pomodoro", minutes: 25, desc: "Quick burst", key: "pomo" },
  { label: "Breathe", minutes: 10, desc: "Reset & reflect", key: "breathe" },
];

export function FocusTimer({ tasks, initialTaskId = "" }: { tasks: Task[]; initialTaskId?: string }) {
  const router = useRouter(); const toast = useToast();
  const [mode, setMode] = React.useState(MODES[0]);
  const [secondsLeft, setSecondsLeft] = React.useState(MODES[0].minutes * 60);
  const [running, setRunning] = React.useState(false);
  const [taskId, setTaskId] = React.useState(initialTaskId);
  const [started, setStarted] = React.useState(false);
  const focusedTask = tasks.find((t) => t.id === taskId);

  React.useEffect(() => { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); }, []);
  React.useEffect(() => { if (!running) return; const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; }; window.addEventListener("beforeunload", h); return () => window.removeEventListener("beforeunload", h); }, [running]);
  React.useEffect(() => { const h = (e: KeyboardEvent) => { if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return; if (e.key === " " || e.code === "Space") { e.preventDefault(); setRunning((r) => !r); if (!running) setStarted(true); } if (e.key === "r" || e.key === "R") { setRunning(false); setStarted(false); setSecondsLeft(mode.minutes * 60); }}; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [running, mode]);

  React.useEffect(() => { if (!running) return; const id = setInterval(() => { setSecondsLeft((s) => { if (s <= 1) { setRunning(false); setStarted(false); try { new Audio("/sounds/timer-end.mp3").play().catch(() => {}); } catch {} if ("Notification" in window && Notification.permission === "granted") new Notification("Session complete", { body: `${mode.label} — done` }); save(true); return 0; } return s - 1; }); }, 1000); return () => clearInterval(id); }, [running, mode.key]);

  async function save(completed: boolean) { const f = new FormData(); f.set("mode", mode.key); f.set("duration_minutes", String(mode.minutes)); f.set("completed", String(completed)); if (taskId) f.set("task_id", taskId); await saveFocusSession(f).then(() => router.refresh()); }
  function stop() { setRunning(false); setStarted(false); save(false); setSecondsLeft(mode.minutes * 60); toast.show("Saved", "info"); }

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const total = mode.minutes * 60;
  const elapsed = total - secondsLeft;
  const progress = total > 0 ? Math.min((elapsed / total) * 360, 360) : 0;
  const ringColor = running ? "#8B5CF6" : "#A78BFA";

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      {focusedTask && (
        <p className="text-center text-sm font-semibold text-accent mb-6 animate-fade-in">Focusing on “{focusedTask.title}”</p>
      )}
      {/* Mode selector */}
      <div className="flex gap-2 justify-center mb-12">
        {MODES.map((md) => (
          <button key={md.minutes} onClick={() => { setRunning(false); setStarted(false); setMode(md); setSecondsLeft(md.minutes * 60); }} disabled={running}
            className={`px-5 h-10 rounded-full text-sm font-semibold transition-all duration-300 focus-ring disabled:opacity-40 ${
              mode.minutes === md.minutes ? "bg-accent-muted-strong text-accent border border-accent/20" : "text-foreground-muted hover:text-foreground border border-transparent"}`}>
            {md.label}
          </button>
        ))}
      </div>

      {/* Energy ring */}
      <div className="relative w-72 h-72 mx-auto">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Track */}
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
          {/* Progress arc with glow */}
          <circle cx="60" cy="60" r="52" fill="none" stroke={ringColor} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${progress} 360`} filter="url(#glow)" className="transition-all duration-1000" />
          {/* Inner breathing ring */}
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(139,92,246,0.08)" strokeWidth="8" className={running ? "ambient-glow" : ""} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-display text-foreground tabular-nums tracking-tighter number-mono">{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</span>
          <span className="text-xs text-foreground-subtle mt-3">{running ? "In flow..." : started ? "Paused" : "Ready"}</span>
        </div>
      </div>

      {/* Task selector */}
      {tasks.length > 0 && !running && (
        <div className="mt-10 flex justify-center">
          <select value={taskId} onChange={(e) => setTaskId(e.target.value)} className="glass-ambient h-10 rounded-full px-4 text-sm text-foreground-muted outline-none focus:ring-2 focus:ring-accent/30"
            aria-label="Focus on a task">
            <option value="" className="bg-base-surface text-foreground">What are you focusing on?</option>
            {tasks.map((t) => <option key={t.id} value={t.id} className="bg-base-surface text-foreground">{t.title}</option>)}
          </select>
        </div>
      )}

      {/* Controls */}
      <div className="mt-10 flex items-center justify-center gap-4">
        <button onClick={() => { if (!running) setStarted(true); setRunning(!running); }}
          className="h-14 px-8 rounded-full font-semibold text-white text-[15px] bg-gradient-to-br from-accent to-accent-700 shadow-glow hover:shadow-glow-strong transition-all duration-300 hover:scale-105 active:scale-100 focus-ring">
          {running ? "Pause" : started ? "Resume" : "Begin"}
        </button>
        {started && (
          <button onClick={stop} className="h-14 px-6 rounded-full text-sm font-medium text-foreground-muted glass-ambient hover:glass-active transition-all duration-300">
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
