import { getJournalEntries } from "@/lib/data";
import { Card, SectionLabel, EmptyState } from "@/components/ui/card";
import { CreateJournalButton } from "@/components/create-journal-button";
import { JournalClient } from "./journal-client";

export default async function JournalPage() {
  const entries = await getJournalEntries();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight font-display">Journal</h1>
          <p className="text-sm text-foreground-muted mt-1">Reflect, capture lessons, and clear your mind.</p>
        </div>
        <CreateJournalButton />
      </header>

      <Card variant="ambient" className="p-5 space-y-4">
        <SectionLabel>Entries ({entries.length})</SectionLabel>
        {entries.length ? (
          <div className="space-y-3">
            {entries.map((entry) => (
              <JournalClient key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>}
            title="No journal entries yet"
            subtitle="Write your first reflection — even two sentences count."
          />
        )}
      </Card>
    </div>
  );
}
