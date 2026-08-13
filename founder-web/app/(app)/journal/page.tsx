import { getJournalEntries } from "@/lib/data";
import { JournalClient } from "./journal-client";
import { NewEntry } from "./new-entry";
import { isDecision, revisitPrompt } from "@/lib/journal";

/**
 * The log.
 *
 * Two things live here, and only one of them is a diary.
 *
 * The decision log is the reason the page exists. A founder makes a dozen
 * calls a week on incomplete information and then, months later, cannot
 * reconstruct which of them were actually wrong versus merely unlucky —
 * because by then they only remember the outcome. Writing down what you knew
 * and what would change your mind, at the moment you decide, is the only thing
 * that makes that distinction recoverable.
 *
 * Days are the lighter half: a mood and a couple of sentences, for whoever
 * wants them. They are second on the page on purpose.
 */
export default async function JournalPage() {
  const entries = await getJournalEntries();
  const decisions = entries.filter(isDecision);
  const days = entries.filter((e) => !isDecision(e));

  // Old calls whose falsification condition may since have fired. This is the
  // compounding part — every other screen looks forward, this one is the only
  // place the app hands you back something you wrote and asks if it held.
  const revisit = decisions
    .map((e) => ({ entry: e, prompt: revisitPrompt(e) }))
    .filter((r): r is { entry: typeof r.entry; prompt: string } => Boolean(r.prompt))
    .slice(0, 2);

  return (
    <div className="max-w-[880px] mx-auto px-5 sm:px-7 pt-7 pb-16 space-y-5">
      <p className="text-base text-[#9C9CA4] max-w-[620px]">
        Decisions, with what you knew at the time. Months from now this is the only record that can
        tell you whether a call was wrong or merely unlucky.
      </p>

      {revisit.length > 0 && (
        <section className="rounded-[8px] border border-[#35353C] bg-[#1B1B1F] p-5">
          <h2 className="text-base font-semibold">Worth rereading</h2>
          <div className="flex flex-col gap-3.5 mt-3.5">
            {revisit.map(({ entry, prompt }) => (
              <p key={entry.id} className="text-sm text-[#E0A33E] leading-[1.55]">{prompt}</p>
            ))}
          </div>
        </section>
      )}

      <NewEntry />

      <section className="space-y-2.5">
        <div className="rule">
          <span className="label-mono">Decisions · {decisions.length}</span>
        </div>
        {decisions.length ? (
          decisions.map((entry) => <JournalClient key={entry.id} entry={entry} />)
        ) : (
          <p className="text-sm text-[#9C9CA4] leading-[1.6] max-w-[62ch] py-2">
            Nothing logged yet. The next time you choose between two roads — a hire, a price, a
            feature you are killing — write the call down here with what would make you reverse it.
            It takes forty seconds and it is the only note you will actually reread.
          </p>
        )}
      </section>

      {days.length > 0 && (
        <section className="space-y-2.5 pt-2">
          <div className="rule">
            <span className="label-mono">Days · {days.length}</span>
          </div>
          {days.map((entry) => <JournalClient key={entry.id} entry={entry} />)}
        </section>
      )}
    </div>
  );
}
