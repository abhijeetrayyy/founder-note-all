import Link from "next/link";
import { Card } from "@/components/ui/card";

const PAINS = [
  { title: "Too many options, no next step", body: "Your list has forty things on it and every one of them looks equally urgent. So you open Twitter instead.", fix: "FounderOS shows you one task at a time — the right one, not the whole pile." },
  { title: "The task is too big to start", body: "\"Launch the new pricing page\" isn't a task, it's a project wearing a trench coat. No wonder you keep skipping it.", fix: "Break anything into a first physical step and a trigger for when you'll do it." },
  { title: "Progress doesn't feel real", body: "You did get things done this week. You just have no evidence of it, so it doesn't feel like it counted.", fix: "Streaks, a daily momentum ring, and a weekly review that shows the work you already did." },
];

const FEATURES = [
  { title: "Right Now", desc: "One recommended task, matched to your energy and priorities — with a reason attached.", icon: "🎯" },
  { title: "Task breakdown", desc: "Turn \"too big to start\" into a two-minute first step and an if-then trigger.", icon: "🧩" },
  { title: "Focus sessions", desc: "Pomodoro, deep work, or a quick sprint — timed, logged, and tied to the task you picked.", icon: "⏱" },
  { title: "Daily & weekly rituals", desc: "A short morning plan, an evening reflection, and a weekly review that closes the loop.", icon: "☀️" },
  { title: "Momentum & streaks", desc: "Habits, energy, and completions turn into a visible trend instead of disappearing into a log.", icon: "📈" },
  { title: "Everything else", desc: "Notes, projects, goals, and an inbox that doesn't just pile up.", icon: "📦" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="w-full sticky top-0 z-40 glass-surface border-b border-base-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-lg text-foreground font-display">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-600 to-accent-700 text-white flex items-center justify-center text-sm font-extrabold shadow-glow">F</span>
            Founder<span className="text-gradient">OS</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="h-10 px-4 rounded-xl text-sm font-semibold text-foreground-muted hover:text-foreground hover:bg-base-raised transition-all duration-200 flex items-center focus-ring">Log in</Link>
            <Link href="/signup" className="h-10 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-accent-600 to-accent-700 shadow-md hover:shadow-glow-strong hover:-translate-y-px transition-all duration-200 flex items-center focus-ring">Get started</Link>
          </div>
        </div>
      </header>

      <section className="px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 text-center">
        <span className="inline-flex items-center h-7 px-3 rounded-full text-2xs font-bold tracking-wide bg-accent-muted text-accent border border-accent-muted-strong mb-8">
          BUILT FOR FOUNDERS WHO GET STUCK
        </span>
        <h1 className="text-4xl sm:text-hero max-w-3xl mx-auto leading-[1.06] text-foreground font-display tracking-tight">
          The to-do list isn&apos;t the problem.
          <br />
          <span className="text-gradient">Choosing from it is.</span>
        </h1>
        <p className="mt-6 text-lg text-foreground-muted max-w-xl mx-auto leading-relaxed">
          FounderOS picks the one thing you should do right now, helps you break it down when it feels
          too big, and shows you the momentum you&apos;re already building.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup" className="h-12 px-8 rounded-xl text-[15px] font-bold text-white bg-gradient-to-br from-accent-600 to-accent-700 shadow-glow hover:shadow-glow-strong hover:-translate-y-px active:translate-y-0 transition-all duration-200 flex items-center justify-center focus-ring">
            Start for free
          </Link>
          <Link href="/login" className="h-12 px-8 rounded-xl text-[15px] font-semibold text-foreground border border-base-border hover:border-accent/30 hover:bg-accent-muted transition-all duration-200 flex items-center justify-center focus-ring">
            I already have an account
          </Link>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-2xs uppercase tracking-[0.14em] font-bold text-foreground-subtle mb-8">Why founders stall — and what actually helps</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PAINS.map((p) => (
              <Card key={p.title} variant="ambient" className="p-6 text-left group hover:glass-active transition-all duration-300">
                <h3 className="font-bold text-[15px] text-foreground leading-snug">{p.title}</h3>
                <p className="mt-3 text-sm text-foreground-muted leading-relaxed">{p.body}</p>
                <p className="mt-5 pt-4 border-t border-base-border text-sm font-semibold text-accent leading-relaxed">{p.fix}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-28">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-2xs uppercase tracking-[0.14em] font-bold text-foreground-subtle mb-8">Everything you need to execute</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <Card key={f.title} variant="ambient" className="p-6 group hover:glass-active hover:-translate-y-1 transition-all duration-300">
                <span className="text-2xl mb-3 block">{f.icon}</span>
                <h3 className="font-bold text-[15px] text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-foreground-muted leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-28">
        <Card variant="focused" className="max-w-3xl mx-auto p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-display tracking-tight">Pick one thing.<br />Start today.</h2>
          <p className="mt-4 text-foreground-muted max-w-sm mx-auto">No credit card, no setup ritual — just tell us what&apos;s on your mind and we&apos;ll help you ship it.</p>
          <Link href="/signup" className="mt-8 inline-flex h-12 px-8 rounded-xl text-[15px] font-bold text-white bg-gradient-to-br from-accent-600 to-accent-700 shadow-glow hover:shadow-glow-strong hover:-translate-y-px active:translate-y-0 transition-all duration-200 items-center justify-center focus-ring">
            Start for free
          </Link>
        </Card>
      </section>

      <footer className="px-6 py-8 border-t border-base-border text-center text-sm text-foreground-subtle">
        FounderOS — built for the founder who has forty tabs open and no idea which one to close first.
      </footer>
    </main>
  );
}
