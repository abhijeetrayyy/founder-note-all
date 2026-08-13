"use client";

import * as React from "react";

/**
 * The floating quick-capture card in the hero.
 *
 * It types a real sentence and then shows what the parser pulled out of it,
 * because the three-second capture is the habit the whole product depends on —
 * and it is far more convincing to watch than to describe.
 */
const DEMO = "call investor tomorrow 3pm urgent @Fundraising";
const CHIPS = [
  { kind: "due", text: "Tomorrow 3:00 PM" },
  { kind: "priority", text: "Urgent" },
  { kind: "energy", text: "Deep" },
  { kind: "project", text: "Fundraising" },
];

export function CaptureDemo() {
  const [n, setN] = React.useState(0);
  const [chips, setChips] = React.useState(0);

  React.useEffect(() => {
    // Respect a reduced-motion preference by showing the finished state.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setN(DEMO.length); setChips(CHIPS.length);
      return;
    }
    let typed = 0, shown = 0, hold = 0;
    const id = setInterval(() => {
      if (typed < DEMO.length) { typed++; setN(typed); return; }
      if (shown < CHIPS.length) { shown++; setChips(shown); return; }
      // Pause on the finished state, then run it again.
      if (hold++ > 45) { typed = 0; shown = 0; hold = 0; setN(0); setChips(0); }
    }, 55);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      aria-label="Quick capture demonstration"
      className="absolute -right-2 sm:-right-4 -bottom-10 w-[360px] max-w-[82vw] rounded-2xl border border-[#26262B] bg-[#141417] p-[18px]"
      style={{ boxShadow: "0 28px 50px -28px rgba(23,21,18,0.5)" }}
    >
      <div className="flex items-center gap-2 font-mono text-2xs tracking-[0.1em] uppercase text-[#9C9CA4]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F0F0EE]" />
        Quick capture · ⌘K
      </div>

      <div className="mt-3 rounded-[11px] border border-[#26262B] bg-[#101013] px-3 py-3 text-base leading-[1.4] min-h-[62px] text-[#F0F0EE]">
        {DEMO.slice(0, n)}
        <span className="inline-block w-0.5 h-4 -mb-0.5 bg-[#F0F0EE] animate-[caret_1s_steps(1)_infinite]" />
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3 min-h-[26px]">
        {CHIPS.slice(0, chips).map((c) => (
          <span key={c.kind}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#1B1B1F] text-[#FFFFFF] animate-rise">
            <span className="font-mono text-2xs opacity-70">{c.kind}</span>
            {c.text}
          </span>
        ))}
      </div>
    </div>
  );
}
