import Link from "next/link";
import { getHabits, getHabitLogsForDate, getRitualEvidence, type RitualTrack } from "@/lib/data";
import { HabitClient } from "./habit-client";
import { CreateHabitButton } from "@/components/create-habit-button";
import { getLastNLogs } from "@/lib/habit-streaks";

/**
 * Rituals.
 *
 * This page used to be generic habit tracking with a flame and a best-streak
 * number, which for a founder is the vanity layer: it measures how long you
 * have gone without breaking a promise about drinking water, and the day the
 * streak breaks is usually the day the app gets closed for good.
 *
 * What it tracks now is the small set of behaviours that keep the rest of the
 * system alive — plan the morning, protect one block, close the day — measured
 * from evidence the founder cannot fake, because those three are the ones that
 * decide whether any of the other screens are worth opening. Personal rituals
 * still live here, underneath, framed as a record of the last fortnight rather
 * than a streak to be defended.
 */

const RITUAL_COPY: Record<RitualTrack["key"], { label: string; why: string; href: string; cta: string }> = {
  plan: {
    label: "Chose the day before the day chose you",
    why: "The mornings you skip this are the mornings your inbox writes your priorities.",
    href: "/plan", cta: "Plan today",
  },
  focus: {
    label: "Protected one real block",
    why: "A day with no protected block is a day of reacting, however busy it felt.",
    href: "/focus", cta: "Start a session",
  },
  shutdown: {
    label: "Closed the day out loud",
    why: "Open loops carried overnight are what wake you at 4am. Naming them is what stops it.",
    href: "/shutdown", cta: "End the day",
  },
};

export default async function HabitsPage() {
  const [habits, todayLogs, rituals] = await Promise.all([
    getHabits(),
    getHabitLogsForDate(),
    getRitualEvidence(14),
  ]);
  const streaks = await getLastNLogs(habits.map((h) => h.id), 60);
  const doneToday = todayLogs.filter((l) => l.done).length;

  // The one worth saying out loud, if any: the ritual that is slipping most.
  const weakest = [...rituals].sort((a, b) => a.kept - b.kept)[0];

  return (
    <div className="max-w-[1180px] mx-auto px-5 sm:px-7 pt-7 pb-16 space-y-5">
      <p className="text-base text-[#9C9CA4] max-w-[640px]">
        Three rituals hold this system up. They are not self-reported — each one is counted from
        what actually happened over the last fortnight.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[14px]">
        {rituals.map((r) => <RitualCard key={r.key} track={r} />)}
      </div>

      {weakest && weakest.kept <= Math.floor(weakest.of / 3) && (
        <p className="text-base text-[#E0A33E] leading-[1.55] max-w-[68ch]">
          {RITUAL_COPY[weakest.key].why} You have kept it {weakest.kept} of the last {weakest.of} days —{" "}
          <Link href={RITUAL_COPY[weakest.key].href} className="text-[#F0F0EE] font-medium hover:underline underline-offset-2">
            {RITUAL_COPY[weakest.key].cta.toLowerCase()}
          </Link>.
        </p>
      )}

      {/* ── Personal rituals ── */}
      <section className="rounded-[8px] border border-[#26262B] bg-[#141417] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#26262B] flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Your own rituals</h2>
            <p className="mt-1 text-xs text-[#9C9CA4] leading-[1.5]">
              Anything you want to hold yourself to. Kept {doneToday} of {habits.length || 0} today.
            </p>
          </div>
          <CreateHabitButton />
        </div>

        {habits.length ? (
          <div className="p-5 flex flex-col gap-2">
            {habits.map((habit) => (
              <HabitClient
                key={habit.id}
                habit={habit}
                log={todayLogs.find((l) => l.habit_id === habit.id)}
                streak={streaks.get(habit.id) ?? 0}
              />
            ))}
          </div>
        ) : (
          <div className="px-5 py-6">
            <p className="text-sm text-[#9C9CA4] leading-[1.6] max-w-[62ch]">
              Nothing here yet, and that is a reasonable place to stay. If you do add one, make it a
              rule that protects your attention rather than a self-improvement project — the ones
              that survive for founders look like these:
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {["No Slack before the first block", "Laptop closed by 7", "One customer conversation", "Walk before the afternoon"].map((s) => (
                <li key={s} className="text-xs text-[#9C9CA4] border border-[#26262B] rounded-[6px] px-2.5 py-1.5">{s}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * A ritual as fourteen marks.
 *
 * Deliberately not a streak counter. A streak turns a missed Tuesday into a
 * loss and gives the founder a reason to stop opening the page; a fortnight of
 * marks shows the same information as a shape they can read without flinching —
 * three gaps in a row means something, one gap means you had a bad Tuesday.
 */
function RitualCard({ track }: { track: RitualTrack }) {
  const copy = RITUAL_COPY[track.key];
  const strong = track.kept >= Math.ceil(track.of * 0.7);
  const tone = strong ? "#5EE0B0" : track.kept >= Math.ceil(track.of * 0.4) ? "#E0A33E" : "#FF8A4C";

  return (
    <section className="rounded-[8px] border border-[#26262B] bg-[#141417] p-5 flex flex-col">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-3xl leading-none tracking-[-0.02em]" style={{ color: tone }}>
          {track.kept}
        </span>
        <span className="font-mono text-2xs text-[#9C9CA4]">of last {track.of} days</span>
      </div>

      <h3 className="mt-3 text-sm font-semibold leading-snug">{copy.label}</h3>

      <div className="flex gap-[3px] mt-3.5" aria-hidden="true">
        {track.days.map((d) => (
          <span key={d.date} title={d.date}
            className="flex-1 h-6 rounded-[3px]"
            style={{ background: d.done ? tone : "#1B1B1F" }} />
        ))}
      </div>
      <p className="sr-only">Kept on {track.days.filter((d) => d.done).map((d) => d.date).join(", ") || "no days"}.</p>

      <p className="mt-3 text-xs text-[#9C9CA4] leading-[1.5] flex-1">{copy.why}</p>

      <Link href={copy.href}
        className="mt-3.5 text-xs font-medium text-[#F0F0EE] hover:underline underline-offset-2">
        {copy.cta} →
      </Link>
    </section>
  );
}
