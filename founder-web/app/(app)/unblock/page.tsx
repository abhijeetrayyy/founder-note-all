import { getLoopsFiltered, getProfile } from "@/lib/data";
import { UnblockClient } from "@/components/unblock-client";
import { EmptyState } from "@/components/ui/card";

export default async function UnblockPage() {
  const [tasks, profile] = await Promise.all([getLoopsFiltered("blocked"), getProfile()]);

  const people = new Set(tasks.map((t) => t.owed_to.trim())).size;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header>
        <p className="text-sm text-foreground-muted mt-1">
          {tasks.length
            ? `You are waiting on ${people} ${people === 1 ? "person" : "people"}. Thirty seconds here moves ${tasks.length === 1 ? "it" : "them all"} into someone else's court.`
            : "Nothing is sitting with anyone else."}
        </p>
      </header>

      {tasks.length ? (
        <UnblockClient tasks={tasks} displayName={profile?.display_name ?? null} />
      ) : (
        <EmptyState
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 11h-6" /></svg>}
          title="Nobody owes you anything"
          subtitle="Hand a loop off and it shows up here until it comes back."
        />
      )}
    </div>
  );
}
