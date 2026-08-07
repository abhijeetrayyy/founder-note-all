import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* ── Nav ── */}
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

      {/* ── Hero ── */}
      <section className="relative px-6 pt-28 pb-24 sm:pt-36 sm:pb-32 text-center overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none bg-[radial-gradient(40rem_30rem_at_50%_-10%,rgba(124,58,237,0.08),transparent_60%)]" />
        <span className="inline-flex items-center h-7 px-3 rounded-full text-2xs font-bold tracking-wide bg-accent-muted text-accent border border-accent-muted-strong mb-8">
          THE EXECUTION SYSTEM FOR FOUNDERS
        </span>
        <h1 className="text-4xl sm:text-hero max-w-3xl mx-auto leading-[1.05] text-foreground font-display tracking-tight">
          Stop staring at your list.<br />
          <span className="text-gradient">Start doing the one thing that matters.</span>
        </h1>
        <p className="mt-8 text-lg sm:text-xl text-foreground-muted max-w-2xl mx-auto leading-relaxed">
          FounderOS isn&apos;t another to-do app. It&apos;s a decision engine that tells you
          <strong className="text-foreground"> what to work on right now</strong> — matched to your energy,
          broken into first steps, and tracked so you can actually see your progress.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup" className="h-12 px-8 rounded-xl text-[15px] font-bold text-white bg-gradient-to-br from-accent-600 to-accent-700 shadow-glow hover:shadow-glow-strong hover:-translate-y-px active:translate-y-0 transition-all duration-200 flex items-center justify-center focus-ring">
            Start for free — no credit card
          </Link>
          <Link href="/login" className="h-12 px-8 rounded-xl text-[15px] font-semibold text-foreground border border-base-border hover:border-accent/30 hover:bg-accent-muted transition-all duration-200 flex items-center justify-center focus-ring">
            I already have an account
          </Link>
        </div>
      </section>

      {/* ── The Core Problem ── */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-2xs uppercase tracking-[0.14em] font-bold text-foreground-subtle mb-3">THE PROBLEM</p>
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-foreground font-display mb-6">Your to-do list is lying to you.</h2>
          <p className="text-center text-foreground-muted max-w-2xl mx-auto mb-12 leading-relaxed">
            It tells you everything is equally important. It doesn&apos;t tell you what actually ships today.
            It gives you forty things and lets you pick — which is exactly why you don&apos;t pick anything.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { emoji: "🔄", title: "Decision paralysis", body: "Every morning you open your task list and spend 20 minutes deciding what to do. By the time you pick, you've already burned your best energy on choosing — not doing." },
              { emoji: "📦", title: "Too big to start", body: "\"Launch the new homepage\" isn't a task — it's two weeks of work hiding inside one line. No wonder you scroll Instagram instead of starting." },
              { emoji: "👻", title: "Invisible progress", body: "You shipped three things this week but have no record of it. Without evidence, your brain resets to \"I got nothing done\" — and that kills motivation." },
            ].map((p) => (
              <Card key={p.title} variant="ambient" className="p-6 text-left group hover:glass-active transition-all duration-300">
                <span className="text-2xl mb-3 block">{p.emoji}</span>
                <h3 className="font-bold text-[15px] text-foreground leading-snug mb-3">{p.title}</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">{p.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-2xs uppercase tracking-[0.14em] font-bold text-foreground-subtle mb-3">HOW IT WORKS</p>
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-foreground font-display mb-6">Three steps. Every day. That&apos;s it.</h2>
          <p className="text-center text-foreground-muted max-w-2xl mx-auto mb-12 leading-relaxed">
            No complicated workflows, no GTD methodology to learn. Three simple actions that compound into real momentum.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Dump your mind", emoji: "⚡", body: "Type anything — \"call investor tomorrow 3pm urgent\" — and FounderOS figures out what it is, when it's due, how important it is, and how much energy it needs. No forms. No dropdowns. Just type.", detail: "Our NLP parser detects dates, times, priorities, energy levels, projects (@Engineering), and tags (#urgent) from natural language. One keystroke to capture." },
              { step: "02", title: "Get ONE recommendation", emoji: "🎯", body: "Each morning, FounderOS shows you the single most important task — matched to your energy level and due date. Not forty things. One thing. With a \"Start focus\" button next to it.", detail: "We use your daily energy check-in (Admin/Medium/Deep) to match tasks you're actually ready for. Deep work tasks when you're fresh, admin tasks when you're tired." },
              { step: "03", title: "Ship and see it", emoji: "📈", body: "Complete tasks, build streaks, watch your momentum ring fill up. At the end of the week, review what you shipped — with evidence. No more \"what did I even do this week?\"", detail: "Habits, focus sessions, energy logs, journal entries, and completed tasks all feed into a weekly review that shows you the work you actually did. Real evidence. Real momentum." },
            ].map((s) => (
              <Card key={s.step} variant="focused" className="p-6 text-left group hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-extrabold text-accent/20 font-display">{s.step}</span>
                  <span className="text-xl">{s.emoji}</span>
                </div>
                <h3 className="font-bold text-[15px] text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-foreground-muted leading-relaxed mb-4">{s.body}</p>
                <p className="text-xs text-foreground-subtle leading-relaxed border-t border-base-border pt-4">{s.detail}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="px-6 pb-28">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-2xs uppercase tracking-[0.14em] font-bold text-foreground-subtle mb-3">EVERYTHING BUILT IN</p>
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-foreground font-display mb-12">No integrations. No setup. Just ship.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "🎯", title: "Smart Quick Capture", desc: "Type naturally — we detect dates, priorities, energy, projects, and tags automatically." },
              { icon: "🧩", title: "Task Breakdown", desc: "Turn \"too big to start\" into a first micro-step and an if-then trigger that removes friction." },
              { icon: "⏱", title: "Focus Timer", desc: "Pomodoro, Deep Work (50m), or Quick Sprint (10m) — with visual progress ring and session logging." },
              { icon: "☀️", title: "Morning Planning Ritual", desc: "60-second guided flow: set your intention → pick 3 MITs → anticipate blockers → commit." },
              { icon: "📓", title: "Daily Journal + Reflect", desc: "Mood tracking, freeform entries, and a weekly review that closes the loop." },
              { icon: "🔥", title: "Habit Streaks", desc: "Daily rituals with visual streaks — build consistency with evidence, not guilt." },
              { icon: "🎯", title: "90-Day Goals", desc: "Set north stars with progress tracking and milestone checklists you can chip away at." },
              { icon: "📊", title: "Pulse Dashboard", desc: "Completion rate, energy distribution, habits, and mood — all in one glanceable view." },
              { icon: "📦", title: "Projects + Notes", desc: "Group tasks and ideas around outcomes. Notes with categories, pinning, and archiving." },
            ].map((f) => (
              <Card key={f.title} variant="ambient" className="p-5 group hover:glass-active hover:-translate-y-0.5 transition-all duration-300">
                <span className="text-xl mb-2 block">{f.icon}</span>
                <h3 className="font-bold text-[15px] text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="px-6 pb-28">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-2xs uppercase tracking-[0.14em] font-bold text-foreground-subtle mb-3">WHO IT&apos;S FOR</p>
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-foreground font-display mb-12">Built for builders, not bureaucrats.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { emoji: "🚀", title: "Solo founders", body: "You're building the product, talking to users, and managing everything else. You don't have time to organize tasks — you need the system to do it for you." },
              { emoji: "🧑‍💻", title: "Indie makers", body: "You ship weekly. You need a quick capture that doesn't break your flow, and a focus timer that keeps you in deep work for 50 minutes straight." },
              { emoji: "🎓", title: "Early-career builders", body: "You're figuring out how to manage time and energy for the first time. FounderOS teaches you the habits — without the complexity." },
            ].map((a) => (
              <Card key={a.title} variant="ambient" className="p-6 text-center group hover:glass-active transition-all duration-300">
                <span className="text-3xl mb-3 block">{a.emoji}</span>
                <h3 className="font-bold text-[15px] text-foreground mb-2">{a.title}</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">{a.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 pb-28">
        <div className="relative max-w-3xl mx-auto p-12 sm:p-16 rounded-card glass-focused text-center overflow-hidden">
          <div className="absolute inset-0 -z-10 pointer-events-none bg-[radial-gradient(30rem_24rem_at_50%_50%,rgba(124,58,237,0.06),transparent_70%)]" />
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-display tracking-tight">
            Pick one thing. Start today.
          </h2>
          <p className="mt-4 text-foreground-muted max-w-sm mx-auto leading-relaxed">
            No credit card. No setup ritual. Just type what&apos;s on your mind and we&apos;ll help you ship it.
          </p>
          <Link href="/signup" className="mt-8 inline-flex h-12 px-8 rounded-xl text-[15px] font-bold text-white bg-gradient-to-br from-accent-600 to-accent-700 shadow-glow hover:shadow-glow-strong hover:-translate-y-px active:translate-y-0 transition-all duration-200 items-center justify-center focus-ring">
            Start for free
          </Link>
        </div>
      </section>

      <footer className="px-6 py-10 border-t border-base-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-foreground-subtle">
          <p>FounderOS — the execution system for people who build things. No AI needed. Just clarity.</p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-foreground transition-colors">Log in</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
