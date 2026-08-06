import { getInboxTasks } from "@/lib/data";
import { EmptyState } from "@/components/ui/card";
import { InboxTriageItem } from "@/components/inbox-triage-item";

export default async function InboxPage() {
  const tasks = await getInboxTasks();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight font-display">Inbox</h1>
        <p className="text-sm text-foreground-muted">
          {tasks.length ? `${tasks.length} thing${tasks.length > 1 ? 's' : ''} to sort. Decide — don't just reread.` : "Nothing to sort. Capture anything on your mind."}
        </p>
      </header>

      {tasks.length ? (
        <div className="space-y-3 animate-slide-up">
          {tasks.map((task) => (
            <InboxTriageItem key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="rounded-card glass-focused p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent-muted flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Inbox zero</h3>
          <p className="text-sm text-foreground-muted max-w-xs mx-auto">Dump anything on your mind using the capture bar above — sort it when you&apos;re ready.</p>
        </div>
      )}
    </div>
  );
}
