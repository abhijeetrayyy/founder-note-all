import { getJournalEntries } from "@/lib/data";
import { CreateJournalButton } from "@/components/create-journal-button";
import { JournalClient } from "./journal-client";

const MOODS = ["😊","😐","🤔","😤","😴"];

export default async function JournalPage() {
  const entries = await getJournalEntries();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight font-display">Reflect</h1>
          <p className="text-sm text-foreground-muted">{entries.length ? `${entries.length} entr${entries.length > 1 ? 'ies' : 'y'} · journalling clears the mind` : "Reflect, capture lessons, and clear your mind."}</p>
        </div>
        <CreateJournalButton />
      </header>

      {entries.length ? (
        <div className="space-y-4 animate-slide-up">
          {entries.map((entry) => (
            <JournalClient key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="rounded-card glass-focused p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent-muted flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Your journal is empty</h3>
          <p className="text-sm text-foreground-muted max-w-xs mx-auto">Write your first reflection — even two sentences make a difference.</p>
        </div>
      )}
    </div>
  );
}
