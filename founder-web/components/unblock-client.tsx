"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { setOwed } from "@/lib/actions";
import { draftNudge } from "@/lib/loops";
import type { Task } from "@/lib/supabase/types";

/**
 * The daily unblock batch.
 *
 * Grouped by person rather than by task, because the awkward part is the
 * message, not the list — one person with four items is one conversation.
 *
 * This drafts and copies; it does not send. Sending on someone's behalf is a
 * different promise, and a wrong send is not undoable.
 */
export function UnblockClient({ tasks, displayName }: { tasks: Task[]; displayName: string | null }) {
  const groups = React.useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of tasks) {
      const who = t.owed_to.trim();
      m.set(who, [...(m.get(who) ?? []), t]);
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [tasks]);

  return (
    <div className="space-y-4">
      {groups.map(([who, items]) => (
        <PersonCard key={who} who={who} items={items} displayName={displayName} />
      ))}
    </div>
  );
}

function PersonCard({ who, items, displayName }: { who: string; items: Task[]; displayName: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const multiple = items.length > 1;

  const initial = React.useMemo(() => {
    if (!multiple) return draftNudge(items[0], displayName);
    const first = who.split(/\s+/)[0];
    const lines = items.map((t) => `• ${t.title}`).join("\n");
    const sign = displayName?.trim() ? `\n\n— ${displayName.trim().split(/\s+/)[0]}` : "";
    return `Hi ${first} — a few things are sitting with you:\n\n${lines}\n\n`
      + `No rush on all of them, but let me know which you can take and which should come back to me.${sign}`;
  }, [items, who, displayName, multiple]);

  const [draft, setDraft] = React.useState(initial);
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.show("Could not reach the clipboard — select the text and copy it.", "error");
    }
  }

  async function backToMe(task: Task) {
    const r = await setOwed(task.id, "", 0);
    if (r.error) toast.show(r.error, "error");
    else { toast.show("Back in your court", "success"); router.refresh(); }
  }

  return (
    <div className="rounded-2xl border border-base-border bg-base-surface p-5 space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold text-foreground">{who}</h2>
        <span className="text-2xs text-foreground-subtle number-mono">
          {items.length} {items.length === 1 ? "loop" : "loops"}
        </span>
      </div>

      <ul className="space-y-1.5">
        {items.map((t) => (
          <li key={t.id} className="flex items-start gap-2 text-sm">
            <span aria-hidden="true" className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground-faint flex-none" />
            <Link href={`/tasks/${t.id}`} className="flex-1 text-foreground-muted hover:text-accent transition-colors">
              {t.title}
            </Link>
            <button
              onClick={() => backToMe(t)}
              className="text-2xs font-semibold text-foreground-subtle hover:text-foreground transition-colors focus-ring rounded px-1"
            >
              back to me
            </button>
          </li>
        ))}
      </ul>

      <div>
        <label htmlFor={`draft-${who}`} className="text-2xs uppercase tracking-wider text-foreground-subtle font-bold">
          Draft
        </label>
        <textarea
          id={`draft-${who}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={multiple ? 8 : 4}
          className="mt-1.5 w-full rounded-xl border border-base-border bg-base-raised p-3 text-sm text-foreground resize-y focus-ring"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={copy}
          className={cn(
            "h-9 px-4 rounded-xl text-sm font-semibold transition-colors focus-ring",
            copied ? "bg-state-done text-white" : "bg-accent-600 text-white hover:shadow-glow",
          )}
        >
          {copied ? "Copied" : "Copy message"}
        </button>
        <span className="text-2xs text-foreground-subtle">Paste it wherever you actually talk to {who.split(/\s+/)[0]}.</span>
      </div>
    </div>
  );
}
