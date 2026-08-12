"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { saveFocusSession, logSessionFeel, quickCapture } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { SESSION_FEEL, type Task } from "@/lib/supabase/types";

/**
 * The focus session, per the handoff's Rituals file.
 *
 * Pre-flight → running → complete, with a park-a-thought escape that captures
 * without ending the block. Running goes full-screen on ink: a timer inside the
 * app chrome is a page with a clock on it, not a protected block.
 *
 * Mode keys are the database's, not invented ones. They were previously "deep"
 * / "pomo" / "breathe" against a CHECK constraint of pomodoro / deep_work /
 * quick_sprint, so every session insert failed — silently, because the error
 * handler reported a missing table instead of the real message.
 */
const MODES = [
  { label: "Deep work", minutes: 50, desc: "Sustained focus", key: "deep_work" },
  { label: "Pomodoro", minutes: 25, desc: "Quick burst", key: "pomodoro" },
  { label: "Sprint", minutes: 10, desc: "Reset & reflect", key: "quick_sprint" },
] as const;

type Phase = "preflight" | "running" | "complete";

export function FocusTimer({ tasks, initialTaskId = "" }: { tasks: Task[]; initialTaskId?: string }) {
  const router = useRouter();
  const toast = useToast();

  const [mode, setMode] = React.useState<(typeof MODES)[number]>(MODES[0]);
  const [phase, setPhase] = React.useState<Phase>("preflight");
  const [secondsLeft, setSecondsLeft] = React.useState(MODES[0].minutes * 60);
  const [running, setRunning] = React.useState(false);
  const [taskId, setTaskId] = React.useState(initialTaskId);
  const [intention, setIntention] = React.useState("");
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [parkOpen, setParkOpen] = React.useState(false);

  const task = tasks.find((t) => t.id === taskId);
  const total = mode.minutes * 60;
  const elapsed = total - secondsLeft;

  const save = React.useCallback(async (completed: boolean, seconds: number) => {
    const f = new FormData();
    f.set("mode", mode.key);
    f.set("duration_minutes", String(Math.max(1, Math.round(seconds / 60))));
    f.set("completed", String(completed));
    f.set("intention", intention);
    if (taskId) f.set("task_id", taskId);
    const r = await saveFocusSession(f);
    if (r.error) { toast.show(r.error, "error"); return; }
    setSessionId(r.id ?? null);
    router.refresh();
  }, [mode.key, intention, taskId, router, toast]);

  // Tick. Ends the block, logs it, then asks how it went.
  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          setPhase("complete");
          try { new Audio("/sounds/timer-end.mp3").play().catch(() => {}); } catch {}
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Session complete", { body: `${mode.label} — done` });
          }
          void save(true, total);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, mode.label, save, total]);

  React.useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  }, []);

  // Guard against closing the tab mid-block.
  React.useEffect(() => {
    if (!running) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [running]);

  // Space pauses, P parks. Both ignored while typing.
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (phase !== "running") return;
      if (e.key === " " || e.code === "Space") { e.preventDefault(); setRunning((r) => !r); }
      if (e.key.toLowerCase() === "p") { e.preventDefault(); setParkOpen(true); setRunning(false); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [phase]);

  function begin() {
    setSecondsLeft(mode.minutes * 60);
    setPhase("running");
    setRunning(true);
  }

  async function endEarly() {
    setRunning(false);
    setPhase("complete");
    await save(false, elapsed);
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const pct = total > 0 ? elapsed / total : 0;

  /* ── Pre-flight ── */
  if (phase === "preflight") {
    return (
      <div className="max-w-lg mx-auto px-5 sm:px-7 py-12">
        <p className="font-mono text-2xs tracking-[0.14em] uppercase text-[#A69E90]">Pre-flight</p>
        <h2 className="mt-2 font-display text-3xl leading-[1.1]">What are you protecting this block for?</h2>

        <div className="grid grid-cols-3 gap-2 mt-6">
          {MODES.map((m) => (
            <button key={m.key} onClick={() => { setMode(m); setSecondsLeft(m.minutes * 60); }}
              className={cn("py-3 px-2 rounded-[11px] border text-xs transition-colors focus-ring",
                mode.key === m.key ? "border-[#5B4FE9] bg-[#EFECFE] text-[#4A3EDA] font-semibold" : "border-[#E0D9CB] bg-[#FBF8F2] text-[#6B6459] hover:border-[#C9C0B0]")}>
              {m.label}
              <span className="block font-mono text-2xs mt-0.5 opacity-70">{m.minutes}m</span>
            </button>
          ))}
        </div>

        <label className="block mt-6">
          <span className="font-mono text-2xs tracking-[0.12em] uppercase text-[#A69E90]">The task</span>
          <select value={taskId} onChange={(e) => setTaskId(e.target.value)}
            className="mt-2 w-full h-11 px-3 rounded-xl border border-[#E0D9CB] bg-[#FFFDF8] text-base focus-ring">
            <option value="">No task — just the block</option>
            {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </label>

        <label className="block mt-4">
          <span className="font-mono text-2xs tracking-[0.12em] uppercase text-[#A69E90]">Intention · one line</span>
          <input value={intention} onChange={(e) => setIntention(e.target.value)}
            placeholder={task ? `e.g. ${task.first_step || "get the first version down"}` : "What counts as done?"}
            className="mt-2 w-full h-11 px-3 rounded-xl border border-[#E0D9CB] bg-[#FFFDF8] text-base focus-ring" />
        </label>

        <button onClick={begin}
          className="mt-6 w-full h-12 rounded-xl bg-[#5B4FE9] hover:bg-[#4A3EDA] text-white text-base font-semibold transition-colors focus-ring">
          Begin · {mode.minutes} minutes
        </button>
      </div>
    );
  }

  /* ── Complete ── */
  if (phase === "complete") {
    return (
      <div className="max-w-lg mx-auto px-5 sm:px-7 py-12">
        <p className="font-mono text-2xs tracking-[0.14em] uppercase text-[#A69E90]">Session complete</p>
        <h2 className="mt-2 font-display text-3xl leading-[1.1]">
          {Math.max(1, Math.round(elapsed / 60))} minutes on {task ? `“${task.title}”` : "the block"}.
        </h2>
        <p className="mt-3 text-base text-[#6B6459]">
          How did it actually go? This is the only way the app learns your real shape.
        </p>

        <div className="flex flex-col gap-2 mt-5">
          {SESSION_FEEL.map((f) => (
            <button key={f.value}
              onClick={async () => {
                if (sessionId) {
                  const r = await logSessionFeel(sessionId, f.value);
                  if (r.error) { toast.show(r.error, "error"); return; }
                }
                toast.show("Logged", "success");
                setPhase("preflight");
                setSecondsLeft(mode.minutes * 60);
                setIntention("");
              }}
              className="text-left px-4 py-3 rounded-xl border border-[#E0D9CB] bg-[#FBF8F2] text-sm text-[#6B6459] hover:border-[#5B4FE9] hover:text-[#4A3EDA] transition-colors focus-ring">
              {f.label}
            </button>
          ))}
        </div>

        <button onClick={() => { setPhase("preflight"); setSecondsLeft(mode.minutes * 60); }}
          className="mt-4 text-sm text-[#A69E90] hover:text-[#171512] transition-colors focus-ring rounded">
          Skip
        </button>
      </div>
    );
  }

  /* ── Running: full-screen ink ── */
  return (
    <div className="fixed inset-0 z-50 bg-[#171512] text-[#FBF8F2] flex flex-col items-center justify-center px-6">
      {task && (
        <p className="font-mono text-2xs tracking-[0.14em] uppercase text-[#8B8272] text-center max-w-md">
          {task.title}
        </p>
      )}
      {intention && <p className="mt-3 text-base text-[#B3AB9C] text-center max-w-md">{intention}</p>}

      <div className="relative mt-10 w-[260px] h-[260px]">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#302C25" strokeWidth="3" />
          <circle cx="50" cy="50" r="46" fill="none" stroke="#A79DFF" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 46}`}
            strokeDashoffset={`${2 * Math.PI * 46 * (1 - pct)}`}
            style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[52px] leading-none tracking-[-0.02em] tabular-nums">{mm}:{ss}</span>
          <span className="mt-2 font-mono text-2xs tracking-[0.14em] uppercase text-[#8B8272]">
            {running ? mode.label : "Paused"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5 mt-10">
        <button onClick={() => setRunning((r) => !r)}
          className="h-11 px-6 rounded-xl bg-[#FBF8F2] text-[#171512] text-base font-semibold hover:opacity-90 transition-opacity focus-ring">
          {running ? "Pause" : "Resume"}
        </button>
        <button onClick={() => { setParkOpen(true); setRunning(false); }}
          className="h-11 px-5 rounded-xl border border-[#3A362F] text-[#E7E1D6] text-base hover:border-[#8B8272] transition-colors focus-ring">
          Park a thought
        </button>
        <button onClick={endEarly}
          className="h-11 px-5 rounded-xl text-[#8B8272] text-base hover:text-[#FBF8F2] transition-colors focus-ring">
          End early
        </button>
      </div>

      <p className="mt-8 font-mono text-2xs text-[#5C554A]">space pause · p park</p>

      {parkOpen && <ParkModal onClose={(resume) => { setParkOpen(false); if (resume) setRunning(true); }} />}
    </div>
  );
}

/**
 * Park a thought without ending the block.
 *
 * The whole reason this exists: the thought that arrives mid-session is the one
 * that ends the session. Giving it three seconds and somewhere to go is what
 * keeps the block intact.
 */
function ParkModal({ onClose }: { onClose: (resume: boolean) => void }) {
  const toast = useToast();
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { setTimeout(() => ref.current?.focus(), 40); }, []);

  async function park(e?: React.FormEvent) {
    e?.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    const f = new FormData();
    f.set("text", text);
    f.set("type", "auto");
    const r = await quickCapture(f);
    setBusy(false);
    if (r.error) { toast.show(r.error, "error"); return; }
    toast.show("Parked — it is in your inbox", "success");
    onClose(true);
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-6"
      onClick={() => onClose(true)}>
      <form onSubmit={park} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[18px] bg-[#201D18] border border-[#302C25] p-6">
        <p className="font-mono text-2xs tracking-[0.14em] uppercase text-[#8B8272]">Park it</p>
        <p className="mt-2 text-base text-[#E7E1D6]">Get it out of your head. The block keeps running.</p>
        <input ref={ref} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="What just came up?"
          className="mt-4 w-full h-11 px-3 rounded-xl bg-[#171512] border border-[#3B352C] text-base text-[#FBF8F2] placeholder:text-[#6E675C] focus-ring" />
        <div className="flex gap-2 mt-4">
          <button type="submit" disabled={!text.trim() || busy}
            className="h-10 px-5 rounded-xl bg-[#5B4FE9] hover:bg-[#6E63FF] text-white text-sm font-semibold transition-colors focus-ring disabled:opacity-50">
            {busy ? "Parking…" : "Park and resume"}
          </button>
          <button type="button" onClick={() => onClose(true)}
            className="h-10 px-4 rounded-xl text-[#8B8272] text-sm hover:text-[#FBF8F2] transition-colors focus-ring">
            Never mind
          </button>
        </div>
      </form>
    </div>
  );
}
