import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="w-full border-b border-border dark:border-dark-border bg-surface/80 dark:bg-dark-surface/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-extrabold text-xl text-primary">
            <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm">F</span>
            FounderOS
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost h-10 px-4 text-sm font-semibold rounded-2xl">
              Log in
            </Link>
            <Link href="/signup" className="btn-primary h-10 px-4 text-sm font-semibold rounded-2xl">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
          Execute with clarity. <span className="text-primary">Every day.</span>
        </h1>
        <p className="mt-6 text-lg text-text-muted dark:text-dark-text-muted max-w-xl">
          The founder execution system that turns chaos into focused action: tasks, notes, goals, habits, journal, and daily planning in one place.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link href="/signup" className="btn-primary h-12 px-6 text-base rounded-2xl">
            Start for free
          </Link>
          <Link href="/login" className="btn-ghost h-12 px-6 text-base rounded-2xl">
            I already have an account
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full text-left">
          {[
            { title: "Daily Command Center", desc: "See your MITs, due tasks, energy level, and habits in one glance." },
            { title: "Smart Capture", desc: "Type naturally: dates, priorities, energy, projects, and tags are parsed automatically." },
            { title: "Goals & Habits", desc: "Track long-term goals and build daily habits with streaks and reflections." },
          ].map((f) => (
            <div key={f.title} className="card p-5 card-hover">
              <h3 className="font-bold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-text-muted dark:text-dark-text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
