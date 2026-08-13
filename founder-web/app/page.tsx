import Link from "next/link";
import { CaptureDemo } from "@/components/marketing/capture-demo";

/**
 * The landing page, built to `FounderOS Site.dc.html`.
 *
 * It argues one thing: completion percentages rise when you add work, so they
 * can never make a founder feel better. Everything on the page follows from
 * that, and none of it promises features the app does not have — the previous
 * version still sold "Right Now", a momentum ring and streaks, all of which
 * were removed from the product for exactly the reason this page now states.
 */

const MECHANICS = [
  { title: "Loops expire", body: "Seven days turns amber. Fourteen forces one of four answers: do it, schedule it, hand it off, or drop it. Nothing sits there quietly generating guilt." },
  { title: "Capacity you can correct", body: "A day holds so much deep work and no more. The planner warns you past it and says what to cut — then learns your real number from what you actually finish." },
  { title: "The anti-list", body: "A visible list of what you are not doing this week, with reasons. Naming it is what stops it following you around." },
  { title: "Shutdown ritual", body: "Under a minute that ends the day: what shipped, what is parked with its next move, tomorrow's one thing. Nobody else builds the screen that lets you stop." },
  { title: "First-move breakdown", body: "Every loop carries a two-minute first move. “Launch the homepage” never appears as a bare checkbox." },
  { title: "Who is waiting on you", body: "Loops carry people, in both directions. One screen shows everything sitting in someone else's court, with the nudge already drafted." },
  { title: "Energy truth", body: "Sessions log how a block actually felt against what you planned, then tell you the real shape of your week. Mondays are not deep-work days for most founders." },
  { title: "Evidence, not vibes", body: "Friday assembles what you shipped from real completions. The antidote to “I did nothing this week.”" },
  { title: "Letting go is free", body: "Anything dropped is recoverable for thirty days, and Friday can release everything older than three weeks in one click. Lists only shrink when deleting stops feeling like failing." },
];

const DEAL = [
  { title: "You get everything, free", body: "No tier games. If it is built, you have it — including whatever ships next month." },
  { title: "I get your honest reaction", body: "What you actually opened, what you ignored, and the thing that made you close the tab. Bluntly." },
  { title: "Price comes later, with warning", body: "When there is a price, beta users hear it first and keep a permanent discount. Nothing switches off overnight." },
  { title: "Your data stays yours", body: "One-click export, any time, whether you stay or not." },
];

export default function LandingPage() {
  return (
    <main className="bg-paper text-foreground">
      {/* ── Nav ── */}
      <header className="max-w-[1160px] mx-auto px-7 h-[72px] flex items-center justify-between">
        <span className="font-display text-2xl tracking-[-0.015em]">
          Founder<span className="text-[#FF8A4C]">OS</span>
        </span>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="px-4 py-2 rounded-xl text-sm text-foreground hover:bg-base-overlay transition-colors focus-ring">
            Sign in
          </Link>
          <Link href="/signup" className="px-4 py-2 rounded-xl text-sm font-medium bg-[#F0F0EE] text-[#0B0B0D] hover:bg-[#FFFFFF] transition-colors focus-ring">
            Join the beta
          </Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-[1160px] mx-auto px-7 pt-16 sm:pt-20 relative">
        <div className="max-w-[880px]">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 border border-[#26262B] rounded-full bg-[#141417] font-mono text-2xs tracking-[0.12em] uppercase text-[#9C9CA4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5EE0B0]" />
            The execution system for founders
          </div>

          <h1 className="font-display font-normal mt-6 text-[clamp(44px,8vw,88px)] leading-[0.96] tracking-[-0.025em] text-balance">
            Your list is not the problem.
            <br />
            <span className="text-[#FF8A4C]">It never shrinking</span> is.
          </h1>

          <p className="mt-6 text-lg sm:text-xl leading-[1.5] text-[#9C9CA4] max-w-[610px]">
            Every other tool measures how much you completed — a number that goes up when you add
            more work, so it can never make you feel better. FounderOS measures the{" "}
            <strong className="font-semibold text-[#F0F0EE]">pressure in your head</strong>, and
            every screen is built to bring it down.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Link href="/signup"
              className="inline-flex items-center gap-2 bg-[#F0F0EE] hover:bg-[#FFFFFF] text-[#0B0B0D] text-lg font-medium px-6 py-3.5 rounded-[13px] transition-colors focus-ring"
              style={{ boxShadow: "0 10px 24px -12px rgba(91,79,233,0.85)" }}>
              Join the free beta
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/login"
              className="inline-flex items-center text-lg text-[#F0F0EE] px-5 py-3.5 rounded-[13px] border border-[#26262B] bg-[#141417] hover:border-[#26262B] transition-colors focus-ring">
              I already have an account
            </Link>
            <span className="font-mono text-xs text-[#9C9CA4] sm:ml-1.5">
              free while we build · no card, no trial clock
            </span>
          </div>
        </div>

        {/* Product frame. Rather than an empty screenshot slot, this is the real
            "one thing" card the app renders — the most honest thing to show. */}
        <div className="mt-16 relative">
          <div className="rounded-[20px] border border-[#26262B] bg-[#141417] overflow-hidden"
            style={{ boxShadow: "0 40px 80px -50px rgba(23,21,18,0.45)" }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#EDE7DB] bg-[#101013]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#26262B]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#26262B]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#26262B]" />
              <span className="ml-3 font-mono text-2xs text-[#9C9CA4]">founderos.app/today</span>
            </div>

            <div className="bg-[#0B0B0D] p-6 sm:p-10">
              <div className="rounded-[20px] bg-[#141417] text-[#F0F0EE] p-6 sm:p-8 max-w-[620px]">
                <p className="font-mono text-2xs tracking-[0.14em] uppercase text-[#6E6E77]">
                  The one thing · matched to Deep energy
                </p>
                <h2 className="font-display text-[clamp(26px,4vw,36px)] leading-[1.1] tracking-[-0.015em] mt-3.5">
                  Rewrite the pricing page hero copy
                </h2>
                <div className="mt-5 p-4 rounded-[13px] bg-[#1B1B1F] border border-[#26262B]">
                  <p className="font-mono text-2xs tracking-[0.12em] uppercase text-[#6E6E77]">First micro-step</p>
                  <p className="mt-2 text-base text-[#F0F0EE]">
                    Open the doc and write three bad headlines. Bad ones. Two minutes.
                  </p>
                </div>
                <div className="flex gap-2.5 mt-5 flex-wrap">
                  <span className="rounded-[11px] bg-[#F0F0EE] text-[#0B0B0D] text-base font-semibold px-[18px] py-3">
                    Start focus · 50m
                  </span>
                  <span className="rounded-[11px] border border-[#35353C] text-[#F0F0EE] text-base px-4 py-3">
                    Not now, show another
                  </span>
                </div>
              </div>
            </div>
          </div>

          <CaptureDemo />
        </div>
      </section>

      {/* ── The problem ── */}
      <section className="max-w-[1160px] mx-auto px-7 pt-40 sm:pt-48">
        <p className="font-mono text-2xs tracking-[0.14em] uppercase text-[#9C9CA4]">The problem</p>
        <h2 className="font-display font-normal mt-4 text-[clamp(32px,5vw,52px)] leading-[1.05] tracking-[-0.02em] max-w-[18ch] text-balance">
          A founder does not have a <span className="text-[#FF8A4C]">task</span> problem.
        </h2>
        <p className="mt-5 text-lg leading-[1.55] text-[#9C9CA4] max-w-[620px]">
          They have an open-loop problem. A worry, a decision they keep deferring, a person they owe
          a reply, a number they have not looked at. Tasks are only the loops that already got named.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          {[
            { n: "01", t: "Wrong unit", b: "The unit is a loop, not a task. Most of what weighs on you was never written down as a checkbox." },
            { n: "02", t: "Wrong direction", b: "Completion percentage rewards adding small tasks. It rises when you take on more, which is the opposite of relief." },
            { n: "03", t: "Wrong assumption", b: "A day has capacity, not slots. Burnout is an overcommit bug, so it gets fixed at the input." },
          ].map((c) => (
            <div key={c.n} className="rounded-[18px] border border-[#26262B] bg-[#141417] p-6">
              <p className="font-mono text-2xs text-[#F0F0EE]">{c.n}</p>
              <h3 className="mt-3 text-lg font-semibold">{c.t}</h3>
              <p className="mt-2 text-base leading-[1.55] text-[#9C9CA4]">{c.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mechanics ── */}
      <section className="max-w-[1160px] mx-auto px-7 pt-40">
        <p className="font-mono text-2xs tracking-[0.14em] uppercase text-[#9C9CA4]">What is actually in it</p>
        <h2 className="font-display font-normal mt-4 text-[clamp(32px,5vw,52px)] leading-[1.05] tracking-[-0.02em] max-w-[20ch] text-balance">
          Strip these out and it is a <span className="text-[#FF8A4C]">to-do app</span>.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          {MECHANICS.map((m) => (
            <div key={m.title} className="rounded-[18px] border border-[#26262B] bg-[#141417] p-6">
              <h3 className="text-lg font-semibold">{m.title}</h3>
              <p className="mt-2 text-base leading-[1.55] text-[#9C9CA4]">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Free beta ── */}
      <section className="max-w-[1160px] mx-auto px-7 pt-40">
        <div className="rounded-[24px] border border-[#26262B] bg-[#141417] p-8 sm:p-12">
          <p className="font-mono text-2xs tracking-[0.14em] uppercase text-[#9C9CA4]">The deal</p>
          <h2 className="font-display font-normal mt-4 text-[clamp(30px,4.5vw,46px)] leading-[1.05] tracking-[-0.02em] max-w-[16ch] text-balance">
            Free while we build. <span className="text-[#FF8A4C]">Honestly</span> free.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-7 mt-10">
            {DEAL.map((d) => (
              <div key={d.title}>
                <h3 className="text-lg font-semibold">{d.title}</h3>
                <p className="mt-1.5 text-base leading-[1.55] text-[#9C9CA4]">{d.body}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-10">
            <Link href="/signup"
              className="inline-flex items-center gap-2 bg-[#F0F0EE] hover:bg-[#FFFFFF] text-[#0B0B0D] text-lg font-medium px-6 py-3.5 rounded-[13px] transition-colors focus-ring">
              Join the free beta
              <span aria-hidden="true">→</span>
            </Link>
            <span className="font-mono text-xs text-[#9C9CA4]">web, iOS and Android · synced</span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="max-w-[1160px] mx-auto px-7 pt-24 pb-16">
        <div className="pt-8 border-t border-[#26262B] flex flex-wrap items-center justify-between gap-4">
          <span className="font-display text-lg">
            Founder<span className="text-[#FF8A4C]">OS</span>
          </span>
          <p className="text-sm text-[#9C9CA4] max-w-[46ch]">
            Built to end the day with less in your head than it started.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-[#9C9CA4] hover:text-[#F0F0EE] transition-colors">Sign in</Link>
            <Link href="/signup" className="text-[#9C9CA4] hover:text-[#F0F0EE] transition-colors">Join the beta</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
