import { getInboxTasks } from "@/lib/data";
import { EmptyState } from "@/components/ui/card";
import { InboxTriageItem } from "@/components/inbox-triage-item";

export default async function InboxPage() {
  const tasks = await getInboxTasks();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header>
        <p className="text-sm text-foreground-muted mt-1">
          {tasks.length ? "Decide for each one — don't just re-read the list." : "Nothing to sort. Capture anything on your mind and process it here."}
        </p>
      </header>

      {tasks.length ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <InboxTriageItem key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>}
          title="Inbox zero"
          subtitle="Use Capture to dump anything on your mind — you can sort it later."
        />
      )}
    </div>
  );
}
