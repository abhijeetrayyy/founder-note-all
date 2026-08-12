"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { parkLoop, setTomorrowOneThing, clearTomorrowOneThing, unparkLoop } from "@/lib/actions";
import { draftNextMove } from "@/lib/loops";
import type { Task } from "@/lib/supabase/types";

/**
 * The evening ritual.
 *
 * Rebuilt for reversibility. Every step used to commit the moment you tapped
 * and there was no way back — parking could not be undone, tomorrow's one thing
 * was chosen the instant you touched it, and the closing screen was a dead end
 * on purpose. A ritual meant to make stopping feel safe cannot be a corridor
 * with locked doors behind you.
 *
 * Now: the step dots are buttons, every commit says what it did and offers to
 * undo it, and the final screen still ends the day but does not trap you there.
 */
const STEPS = ["What shipped", "Park what is open", "Tomorrow"] as const;

export function ShutdownClient({
  shipped, open, name,
}: { shipped: Task[]; open: Task[]; name: string | null }) {
  const [step, setStep] = React.useState(0);
  const first = name?.trim().split(/\s+/)[0] || "founder";

  // Frozen on mount so rows cannot reorder or vanish under a finger mid-ritual.
  const [rows] = React.useState(() => open);

  return (
    <div className="min-h-screen bg-[#171512] text-[#FBF8F2] flex flex-col">
      <header className="flex items-center justify-between px-6 py-5 gap-4">
        <nav className="flex items-center gap-2" aria-label="Shutdown steps">
          {STEPS.map((label, i) => (
            <button
              key={label}
              onClick={() => setStep(i)}
              aria-current={i === step ? "step" : undefined}
              aria-label={`Step ${i + 1}: ${label}`}
              title={label}
              className={cn(
                "h-1.5 w-10 rounded-full transition-colors focus-ring",
                i === step ? "bg-[#A79DFF]" : i < step ? "bg-[#5B4FE9]/60 hover:bg-[#A79DFF]" : "bg-[#302C25] hover:bg-[#3B352C]",
              )}
            />
          ))}
          <span className="ml-2 font-mono text-2xs text-[#8B8272]">
            {/* Step 3 is the closing screen, which sits outside the count —
                without this it read "4 of 3". */}
            {step < STEPS.length ? `${step + 1} of ${STEPS.length} · ${STEPS[step]}` : "Day closed"}
          </span>
        </nav>

        <div className="flex items-center gap-3">
          {step > 0 && step < 3 && (
            <button onClick={() => setStep((s) => s - 1)}
              className="text-xs text-[#8A8378] hover:text-[#FBF8F2] transition-colors focus-ring rounded">
              ← Back
            </button>
          )}
          <Link href="/today" className="text-xs text-[#8A8378] hover:text-[#FBF8F2] transition-colors">
            Leave — nothing is lost
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-lg">
          {step === 0 && <Shipped shipped={shipped} name={first} hasOpen={rows.length > 0} onNext={() => setStep(1)} />}
          {step === 1 && <Park rows={rows} onNext={() => setStep(2)} />}
          {step === 2 && <Tomorrow rows={rows} onDone={() => setStep(3)} />}
          {step === 3 && <Closed name={first} onBack={() => setStep(2)} />}
        </div>
      </main>
    </div>
  );
}

/* ── 1 · What shipped ── */
function Shipped({ shipped, name, hasOpen, onNext }: {
  shipped: Task[]; name: string; hasOpen: boolean; onNext: () => void;
}) {
  return (
    <div className="space-y-7 animate-fade-in">
      <div>
        <p className="font-mono text-2xs tracking-[0.2em] uppercase text-[#8B8272]">Step 1 · nothing to fill in</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.1]">
          {shipped.length === 0
            ? `Nothing shipped today, ${name}.`
            : `You did ${shipped.length} ${shipped.length === 1 ? "thing" : "things"} today.`}
        </h1>
        <p className="mt-2 text-base text-[#A79488]">
          {shipped.length === 0
            ? "Some days hold the line instead. That still counts as a day worked."
            : "Assembled from what you actually closed — often more than you remember."}
        </p>
      </div>

      {shipped.length > 0 && (
        <ul className="space-y-2">
          {shipped.map((t) => (
            <li key={t.id} className="flex items-start gap-3 text-base">
              <span aria-hidden="true" className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#4FCBB6] flex-none" />
              <span className="text-[#E8E2D8]">{t.title}</span>
            </li>
          ))}
        </ul>
      )}

      <button onClick={onNext}
        className="h-12 px-6 rounded-xl bg-[#FBF8F2] text-[#171512] font-semibold text-sm hover:opacity-90 transition-opacity focus-ring">
        {hasOpen ? "Next — park what is open" : "Next"}
      </button>
    </div>
  );
}

/* ── 2 · Park ── */
function Park({ rows, onNext }: { rows: Task[]; onNext: () => void }) {
  if (rows.length === 0) {
    return (
      <div className="space-y-7 animate-fade-in">
        <div>
          <p className="font-mono text-2xs tracking-[0.2em] uppercase text-[#8B8272]">Step 2</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.1]">Nothing is left open.</h1>
          <p className="mt-2 text-base text-[#A79488]">There is nothing to put down, because you already did.</p>
        </div>
        <button onClick={onNext}
          className="h-12 px-6 rounded-xl bg-[#FBF8F2] text-[#171512] font-semibold text-sm hover:opacity-90 transition-opacity focus-ring">
          Next — tomorrow&apos;s one thing
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <div>
        <p className="font-mono text-2xs tracking-[0.2em] uppercase text-[#8B8272]">Step 2 · optional</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.1]">{rows.length} still open.</h1>
        <p className="mt-2 text-base text-[#A79488]">
          Giving each one its next move is what lets your head put it down. Tap to accept — you can undo any of them.
        </p>
      </div>

      <div className="space-y-2.5">
        {rows.map((t) => <ParkRow key={t.id} task={t} />)}
      </div>

      <button onClick={onNext}
        className="h-12 px-6 rounded-xl bg-[#FBF8F2] text-[#171512] font-semibold text-sm hover:opacity-90 transition-opacity focus-ring">
        Next — tomorrow&apos;s one thing
      </button>
    </div>
  );
}

function ParkRow({ task }: { task: Task }) {
  const [move, setMove] = React.useState(() => draftNextMove(task));
  const [state, setState] = React.useState<"idle" | "editing" | "saved">(task.first_step ? "idle" : "idle");
  const [busy, setBusy] = React.useState(false);
  const previous = React.useRef(task.first_step);

  async function accept() {
    setBusy(true);
    const r = await parkLoop(task.id, move);
    setBusy(false);
    if (!r.error) setState("saved");
  }

  // Puts the loop back exactly as it was, including an empty first step.
  async function undo() {
    setBusy(true);
    await unparkLoop(task.id, previous.current);
    setBusy(false);
    setState("idle");
  }

  return (
    <div className={cn("rounded-xl border p-3.5 transition-colors",
      state === "saved" ? "border-[#2C4A44] bg-[#14302C]" : "border-[#302C25] bg-[#201D18]")}>
      <p className="text-sm font-semibold text-[#FBF8F2]">{task.title}</p>

      {state === "editing" ? (
        <div className="mt-2.5 flex gap-2">
          <input value={move} onChange={(e) => setMove(e.target.value)} autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") accept(); if (e.key === "Escape") setState("idle"); }}
            className="flex-1 h-9 px-3 rounded-lg bg-[#171512] border border-[#3B352C] text-sm text-[#FBF8F2] focus-ring" />
          <button onClick={accept} disabled={busy}
            className="h-9 px-3 rounded-lg bg-[#A79DFF] text-[#171512] text-xs font-bold focus-ring disabled:opacity-50">Save</button>
          <button onClick={() => setState("idle")}
            className="h-9 px-2 rounded-lg text-[#8B8272] text-xs hover:text-[#FBF8F2] focus-ring">Cancel</button>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="font-mono text-2xs uppercase tracking-wider text-[#8B8272]">Next</span>
          <span className="text-sm text-[#C9C0B3] flex-1 min-w-[8rem]">{move}</span>
          {state === "saved" ? (
            <>
              <span className="text-2xs font-mono uppercase tracking-wider text-[#4FCBB6]">parked</span>
              <button onClick={undo} disabled={busy}
                className="h-8 px-2.5 rounded-lg text-[#8B8272] text-xs font-semibold hover:text-[#FBF8F2] transition-colors focus-ring disabled:opacity-50">
                Undo
              </button>
            </>
          ) : (
            <>
              <button onClick={accept} disabled={busy}
                className="h-8 px-3 rounded-lg bg-[#302C25] text-[#FBF8F2] text-xs font-semibold hover:bg-[#3B352C] transition-colors focus-ring disabled:opacity-50">
                Yes
              </button>
              <button onClick={() => setState("editing")}
                className="h-8 px-2.5 rounded-lg text-[#8B8272] text-xs font-semibold hover:text-[#FBF8F2] transition-colors focus-ring">
                Change
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── 3 · Tomorrow ── */
function Tomorrow({ rows, onDone }: { rows: Task[]; onDone: () => void }) {
  const [picked, setPicked] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [candidates] = React.useState(() => rows.slice(0, 5));

  async function choose(id: string) {
    setBusy(true);
    if (picked === id) {
      // Tapping the chosen one again unpicks it.
      await clearTomorrowOneThing(id);
      setPicked(null);
    } else {
      if (picked) await clearTomorrowOneThing(picked);
      await setTomorrowOneThing(id);
      setPicked(id);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <div>
        <p className="font-mono text-2xs tracking-[0.2em] uppercase text-[#8B8272]">Step 3 · optional</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.1]">Tomorrow&apos;s one thing.</h1>
        <p className="mt-2 text-base text-[#A79488]">
          Pick it now, while you have the context, so the morning is not a decision. Tap again to unpick.
        </p>
      </div>

      {candidates.length ? (
        <div className="space-y-2">
          {candidates.map((t) => (
            <button key={t.id} onClick={() => choose(t.id)} disabled={busy}
              aria-pressed={picked === t.id}
              className={cn("w-full text-left rounded-xl border p-3.5 text-sm transition-colors focus-ring disabled:opacity-60 flex items-center gap-3",
                picked === t.id ? "border-[#A79DFF] bg-[#241F3D] text-[#FBF8F2]" : "border-[#302C25] bg-[#201D18] text-[#C9C0B3] hover:border-[#3B352C]")}>
              <span className="flex-1">{t.title}</span>
              {picked === t.id && <span className="font-mono text-2xs uppercase tracking-wider text-[#A79DFF]">chosen · tap to undo</span>}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#8A8378]">Nothing open to carry forward. Tomorrow starts clean.</p>
      )}

      <button onClick={onDone}
        className="h-12 px-6 rounded-xl bg-[#FBF8F2] text-[#171512] font-semibold text-sm hover:opacity-90 transition-opacity focus-ring">
        {picked ? "Done — close the day" : "Skip — close the day"}
      </button>
    </div>
  );
}

/* ── 4 · Closed ──
   Still terminal in feel, but no longer a trap: the day is closed and there is
   one quiet way back for anyone who arrived here by mis-tapping. */
function Closed({ name, onBack }: { name: string; onBack: () => void }) {
  return (
    <div className="text-center animate-fade-in">
      <h1 className="font-display text-4xl leading-[1.1]">That is the day, {name}.</h1>
      <p className="mt-4 text-base text-[#A79488]">
        Everything open has a next move. Tomorrow has its one thing.
      </p>
      <p className="mt-10 text-sm text-[#6E675C]">Close the laptop.</p>

      <div className="mt-12 flex items-center justify-center gap-5">
        <button onClick={onBack}
          className="text-xs text-[#5C554A] hover:text-[#A79488] transition-colors focus-ring rounded">
          ← Not finished yet
        </button>
        <Link href="/today"
          className="text-xs text-[#5C554A] hover:text-[#A79488] transition-colors">
          Back to today
        </Link>
      </div>
    </div>
  );
}
