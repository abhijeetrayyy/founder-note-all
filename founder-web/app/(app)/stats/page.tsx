import Link from "next/link";
import { getPressure, getEnergyTruth, getClosureEvidence, getStats } from "@/lib/data";
import { GRACE_DAYS } from "@/lib/loops";

/**
 * Pulse.
 *
 * Rebuilt. This page previously led with a completion ring reading "0 of 4
 * tasks completed, all time" — a ratio that rises when you add work, and the
 * one number the product exists to reject. It also contradicted the sidebar,
 * which counts loops needing an answer, so the app was running two different
 * models of itself on one screen.
 *
 * Every number here now has a decision attached, and the headline is energy
 * truth: what the app has learned about your real shape from logged sessions
 * rather than from an assumption it made on day one.
 */
export default async function StatsPage() {
  const [pressure, truth, evidence, stats] = await Promise.all([
    getPressure(),
    getEnergyTruth(),
    getClosureEvidence(30),
    getStats(),
  ]);

  const needsAnswer = pressure.rotting_count + pressure.aging_count + pressure.unclear_count;

  return (
    <div className="max-w-[1180px] mx-auto px-5 sm:px-7 pt-7 pb-16 space-y-5">
      <p className="text-base text-[#9C9CA4] max-w-[620px]">
        Six numbers, each attached to something you could do today. Nothing here is a score.
      </p>

      {/* ── Energy truth ── */}
      <section className="rounded-[8px] border border-[#26262B] bg-[#141417] p-5">
        <div className="flex items-baseline justify-between gap-3.5 flex-wrap">
          <h2 className="text-base font-semibold">Energy truth</h2>
          <span className="font-mono text-2xs text-[#9C9CA4]">
            {truth ? `${truth.total} logged sessions · 60 days` : "needs 5 logged sessions"}
          </span>
        </div>

        {truth ? (
          <>
            <p className="mt-3 font-display text-3xl leading-[1.2] max-w-[38ch]">
              {truth.worstDay
                ? <>Your blocks on <em className="not-italic text-[#FF8A4C]">{truth.worstDay}</em> rarely work. Stop planning deep work there.</>
                : truth.bestDay
                ? <><em className="not-italic text-[#FF8A4C]">{truth.bestDay}</em> is where your good blocks land. Protect it.</>
                : <>No weekday pattern yet — keep logging how each block went.</>}
            </p>

            <div className="grid grid-cols-7 gap-2 mt-5">
              {truth.byDay.map((d) => {
                const rate = d.sessions ? d.good / d.sessions : 0;
                return (
                  <div key={d.day} className="flex flex-col items-center gap-1.5">
                    <div className="w-full h-16 rounded-lg bg-[#1B1B1F] flex flex-col justify-end overflow-hidden"
                      title={`${d.good} of ${d.sessions} felt good`}>
                      {d.sessions > 0 && (
                        <div className="w-full bg-[#F0F0EE]" style={{ height: `${Math.max(rate * 100, 6)}%` }} />
                      )}
                    </div>
                    <span className="font-mono text-2xs text-[#9C9CA4]">{d.day.slice(0, 2)}</span>
                    <span className="font-mono text-2xs text-[#6E6E77]">{d.sessions || "—"}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-[#9C9CA4]">
              Bar height is the share of blocks that felt like flow or solid. The number below is sessions logged.
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-[#9C9CA4] leading-[1.55] max-w-[52ch]">
            Finish a few focus sessions and answer “how did it go”. After five, this becomes the most useful
            number in the app — the only thing that can correct your capacity from evidence instead of
            assumption.{" "}
            <Link href="/focus" className="text-[#F0F0EE] font-medium hover:underline">Start a session →</Link>
          </p>
        )}
      </section>

      {/* ── Numbers with an action attached ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[14px]">
        <Metric value={needsAnswer} label="Need an answer"
          sub={`${pressure.rotting_count} rotting · ${pressure.aging_count} aging`}
          href="/loops?filter=rotting" cta="Triage them" alert={pressure.rotting_count > 0} />
        <Metric value={pressure.owed_count} label="People waiting on you"
          sub={pressure.owed_count ? "The heaviest thing you carry" : "Nobody is waiting"}
          href="/loops?filter=owed" cta="See who" alert={pressure.owed_count > 0} />
        <Metric value={pressure.blocked_count} label="You are waiting on"
          sub={pressure.blocked_count ? "Thirty seconds moves these" : "Nothing is with anyone else"}
          href="/unblock" cta="Send the nudges" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[14px]">
        <Metric value={evidence.closedOld} label={`Closed that were older than ${GRACE_DAYS} days`}
          sub={`${evidence.closed} loops closed in 30 days`} href="/review" cta="See the week" good />
        <Metric value={evidence.released} label="Let go, on purpose" sub="Still restorable"
          href="/loops?filter=released" cta="Review them" />
        <Metric value={stats.habitsThisWeek} label="Rituals kept this week" sub="Evidence, not pressure"
          href="/habits" cta="Open rituals" good />
      </div>
    </div>
  );
}

/**
 * One number, one sentence, one place to go.
 *
 * The old page rendered six tiles in six different saturated colours, three of
 * which restated the ring above them. Colour here is semantic only — it marks
 * something needing attention, never decorates a count.
 */
function Metric({ value, label, sub, href, cta, alert, good }: {
  value: number; label: string; sub: string; href: string; cta: string;
  alert?: boolean; good?: boolean;
}) {
  const tone = alert ? "#FF8A4C" : good ? "#5EE0B0" : "#F0F0EE";
  return (
    <Link href={href}
      className="group rounded-[8px] border border-[#26262B] bg-[#141417] p-5 flex flex-col hover:border-[#35353C] transition-colors focus-ring">
      <span className="font-mono text-3xl leading-none tracking-[-0.02em]" style={{ color: tone }}>{value}</span>
      <span className="mt-2.5 text-sm font-semibold leading-snug">{label}</span>
      <span className="mt-1 text-xs text-[#9C9CA4] leading-snug">{sub}</span>
      <span className="mt-3 text-xs font-medium text-[#F0F0EE] group-hover:underline underline-offset-2">{cta} →</span>
    </Link>
  );
}
