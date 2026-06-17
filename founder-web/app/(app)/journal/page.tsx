import { getJournalEntries } from "@/lib/data";
import { Card, SectionLabel } from "@/components/ui/card";
import { CreateJournalButton } from "@/components/create-journal-button";

export default async function JournalPage() {
  const entries = await getJournalEntries();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Journal</h1>
          <p className="text-text-muted dark:text-dark-text-muted mt-1">Reflect, capture lessons, and clear your mind.</p>
        </div>
        <CreateJournalButton />
      </header>

      <Card className="p-5 space-y-4">
        <SectionLabel>ENTRIES ({entries.length})</SectionLabel>
        {entries.length ? (
          entries.map((entry) => (
            <div key={entry.id} className="p-4 rounded-2xl border bg-surface dark:bg-dark-surface border-border dark:border-dark-border">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-extrabold text-text-muted dark:text-dark-text-muted">{entry.entry_date}</span>
                <span className="text-lg">{["😊", "😐", "🤔", "😤", "😴"][entry.mood]}</span>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap">{entry.content}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-text-muted dark:text-dark-text-muted">No journal entries yet. Write your first reflection.</p>
        )}
      </Card>
    </div>
  );
}
