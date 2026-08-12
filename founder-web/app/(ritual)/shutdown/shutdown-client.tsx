"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { parkLoop, setTomorrowOneThing } from "@/lib/actions";
import { draftNextMove } from "@/lib/loops";
import type { Task } from "@/lib/supabase/types";

/**
 * The evening ritual — the burnout-prevention half of the product.
 *
 * Budgeted at well under a minute, and built almost entirely from buttons. The
 * handoff asked for a written next move per open loop, which is five text
 * fields at 7pm after a twelve-hour day: it gets skipped, and a skipped ritual
 * converts straight into guilt. So every move is pre-drafted and accepted with
 * a tap, and typing is always optional.
 */
export function ShutdownClient({
  shipped, open, name,
}: { shipped: Task[]; open: Task[]; name: string | null }) {
  const [step, setStep] = React.useState(0);
  const first = name?.trim().split(/\s+/)[0] || "founder";

  const steps = [
    <Shipped key="s" shipped={shipped} name={first} onNext={() => setStep(1)} />,
    <Park key="p" open={open} onNext={() => setStep(2)} />,
    <Tomorrow key="t" open={open} onNext={() => setStep(3)} />,
    <Closed key="c" name={first} />,
  ];

  return (
    <div className="min-h-screen bg-[#171512] text-[#FBF8F2] flex flex-col">
      {step < 3 && (
        <header className="flex items-center justify-between px-6 py-5">
          <div className="flex gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn("h-1 w-9 rounded-full transition-colors", i <= step ? "bg-[#A79DFF]" : "bg-[#302C25]")} />
            ))}
          </div>
          <Link href="/today" className="text-xs text-[#8A8378] hover:text-[#FBF8F2] transition-colors">
            Not now
          </Link>
        </header>
      )}
      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-lg">{steps[step]}</div>
      </main>
    </div>
  );
}

/* ── 1. What shipped — assembled before a word is typed ── */
function Shipped({ shipped, name, onNext }: { shipped: Task[]; name: string; onNext: () => void }) {
  return (
    <div className="space-y-7 animate-fade-in">
      <div>
        <p className="text-2xs uppercase tracking-[0.2em] text-[#8A8378] font-bold">Shutdown</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight font-display">
          {shipped.length === 0
            ? `Nothing shipped today, ${name}.`
            : `You did ${shipped.length} ${shipped.length === 1 ? "thing" : "things"} today.`}
        </h1>
        <p className="mt-2 text-sm text-[#A79488]">
          {shipped.length === 0
            ? "Some days hold the line instead. That still counts as a day worked."
            : "Often more than you remember."}
        </p>
      </div>

      {shipped.length > 0 && (
        <ul className="space-y-2">
          {shipped.map((t) => (
            <li key={t.id} className="flex items-start gap-3 text-[15px]">
              <span aria-hidden="true" className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#4FCBB6] flex-none" />
              <span className="text-[#E8E2D8]">{t.title}</span>
            </li>
          ))}
        </ul>
      )}

      <button onClick={onNext} className="h-12 px-6 rounded-xl bg-[#FBF8F2] text-[#171512] font-semibold text-sm hover:opacity-90 transition-opacity focus-ring">
        {shipped.length === 0 ? "Park what is open" : "Next — park what is open"}
      </button>
    </div>
  );
}

/* ── 2. Park the open loops ── */
function Park({ open, onNext }: { open: Task[]; onNext: () => void }) {
  // Frozen for the same reason as the step below: parking revalidates, and rows
  // must not reorder or vanish while the founder is tapping down the list.
  const [rows] = React.useState(() => open);

  if (rows.length === 0) {
    return (
      <div className="space-y-7 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold leading-tight font-display">Nothing is left open.</h1>
          <p className="mt-2 text-sm text-[#A79488]">There is nothing to put down, because you already did.</p>
        </div>
        <button onClick={onNext} className="h-12 px-6 rounded-xl bg-[#FBF8F2] text-[#171512] font-semibold text-sm hover:opacity-90 transition-opacity focus-ring">
          Next — tomorrow&apos;s one thing
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold leading-tight font-display">
          {rows.length} still open.
        </h1>
        <p className="mt-2 text-sm text-[#A79488]">
          Give each one its next move and your head can let go of it. Tap to accept.
        </p>
      </div>

      <div className="space-y-2.5">
        {rows.map((t) => <ParkRow key={t.id} task={t} />)}
      </div>

      <button onClick={onNext} className="h-12 px-6 rounded-xl bg-[#FBF8F2] text-[#171512] font-semibold text-sm hover:opacity-90 transition-opacity focus-ring">
        Next — tomorrow&apos;s one thing
      </button>
    </div>
  );
}

function ParkRow({ task }: { task: Task }) {
  const [move, setMove] = React.useState(() => draftNextMove(task));
  const [state, setState] = React.useState<"idle" | "editing" | "saved">("idle");

  async function accept() {
    setState("saved");
    await parkLoop(task.id, move);
  }

  return (
    <div className={cn("rounded-xl border p-3.5 transition-colors", state === "saved" ? "border-[#2C4A44] bg-[#14302C]" : "border-[#302C25] bg-[#201D18]")}>
      <p className="text-sm font-semibold text-[#FBF8F2]">{task.title}</p>

      {state === "editing" ? (
        <div className="mt-2.5 flex gap-2">
          <input
            value={move}
            onChange={(e) => setMove(e.target.value)}
            autoFocus
            className="flex-1 h-9 px-3 rounded-lg bg-[#171512] border border-[#3B352C] text-sm text-[#FBF8F2] focus-ring"
          />
          <button onClick={accept} className="h-9 px-3 rounded-lg bg-[#A79DFF] text-[#171512] text-xs font-bold focus-ring">
            Save
          </button>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="text-2xs uppercase tracking-wider text-[#8A8378] font-bold">Next</span>
          <span className="text-sm text-[#C9C0B3] flex-1 min-w-[8rem]">{move}</span>
          {state === "saved" ? (
            <span className="text-2xs font-bold text-[#4FCBB6]">parked</span>
          ) : (
            <>
              <button onClick={accept} className="h-8 px-3 rounded-lg bg-[#302C25] text-[#FBF8F2] text-xs font-semibold hover:bg-[#3B352C] transition-colors focus-ring">
                Yes
              </button>
              <button onClick={() => setState("editing")} className="h-8 px-2.5 rounded-lg text-[#8A8378] text-xs font-semibold hover:text-[#FBF8F2] transition-colors focus-ring">
                Change
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── 3. Tomorrow's one thing, chosen while context is warm ── */
function Tomorrow({ open, onNext }: { open: Task[]; onNext: () => void }) {
  const [picked, setPicked] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  // Frozen on mount. Choosing tomorrow's one thing moves its due date, which
  // drops it out of the server's "open today" list — so without this the option
  // you just tapped disappears from under your finger.
  const [candidates] = React.useState(() => open.slice(0, 5));

  async function choose(id: string) {
    setPicked(id);
    setBusy(true);
    await setTomorrowOneThing(id);
    setBusy(false);
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold leading-tight font-display">Tomorrow&apos;s one thing.</h1>
        <p className="mt-2 text-sm text-[#A79488]">
          Pick it now, while you still have the context. The morning should not be a decision.
        </p>
      </div>

      {candidates.length ? (
        <div className="space-y-2">
          {candidates.map((t) => (
            <button
              key={t.id}
              onClick={() => choose(t.id)}
              disabled={busy}
              className={cn(
                "w-full text-left rounded-xl border p-3.5 text-sm transition-colors focus-ring disabled:opacity-60",
                picked === t.id ? "border-[#A79DFF] bg-[#241F3D] text-[#FBF8F2]" : "border-[#302C25] bg-[#201D18] text-[#C9C0B3] hover:border-[#3B352C]",
              )}
            >
              {t.title}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#8A8378]">Nothing open to carry forward. Tomorrow starts clean.</p>
      )}

      <button onClick={onNext} className="h-12 px-6 rounded-xl bg-[#FBF8F2] text-[#171512] font-semibold text-sm hover:opacity-90 transition-opacity focus-ring">
        {picked ? "Done — close the laptop" : "Skip — close the laptop"}
      </button>
    </div>
  );
}

/* ── 4. Terminal. Deliberately nothing to click. ── */
function Closed({ name }: { name: string }) {
  return (
    <div className="text-center animate-fade-in">
      <h1 className="text-4xl font-bold leading-tight font-display">That is the day, {name}.</h1>
      <p className="mt-4 text-[15px] text-[#A79488]">
        Everything open has a next move. Tomorrow has its one thing.
      </p>
      <p className="mt-10 text-sm text-[#6E675C]">Close the laptop.</p>
    </div>
  );
}
