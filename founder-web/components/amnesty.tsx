"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { runAmnesty, restoreLoop } from "@/lib/actions";
import { AMNESTY_DAYS, RESTORE_DAYS, daysSince } from "@/lib/loops";
import type { Task } from "@/lib/supabase/types";

type Released = { id: string; title: string };

/**
 * The Friday release.
 *
 * Not a decision, not a modal, not four options per item — a release. It exists
 * because dropping things has to be cheaper than keeping them, or the list only
 * ever grows: every item a founder keeps is insurance against forgetting, and
 * you cannot argue someone out of that, you can only make letting go safe.
 *
 * Two rules it must never break: show exactly what will go before it goes, and
 * show exactly what went afterwards with a way back.
 */
export function Amnesty({ candidates }: { candidates: Task[] }) {
  const router = useRouter();
  const toast = useToast();
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [receipt, setReceipt] = React.useState<Released[] | null>(null);
  const [restored, setRestored] = React.useState<Set<string>>(new Set());

  async function go() {
    setBusy(true);
    const r = await runAmnesty(AMNESTY_DAYS);
    setBusy(false);
    if (r.error) { toast.show(r.error, "error"); return; }
    setReceipt(r.released ?? []);
    setConfirming(false);
    router.refresh();
  }

  async function bringBack(id: string) {
    const r = await restoreLoop(id);
    if (r.error) { toast.show(r.error, "error"); return; }
    setRestored((s) => new Set(s).add(id));
    router.refresh();
  }

  // ---- after: the receipt ----
  if (receipt) {
    if (receipt.length === 0) {
      return <Shell><p className="text-sm text-foreground-muted">Nothing was old enough to let go.</p></Shell>;
    }
    return (
      <Shell>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Let go of {receipt.length} {receipt.length === 1 ? "loop" : "loops"}.
          </p>
          <p className="text-2xs text-foreground-muted mt-0.5">
            Here they are, in case any of them mattered. Restorable for {RESTORE_DAYS} days.
          </p>
        </div>
        <ul className="space-y-1.5">
          {receipt.map((r) => {
            const back = restored.has(r.id);
            return (
              <li key={r.id} className="flex items-center gap-2 text-sm">
                <span className={cn("flex-1 truncate", back ? "text-foreground" : "text-foreground-muted line-through")}>
                  {r.title}
                </span>
                {back ? (
                  <span className="text-2xs font-semibold text-state-done">back</span>
                ) : (
                  <button
                    onClick={() => bringBack(r.id)}
                    className="text-2xs font-semibold text-foreground-subtle hover:text-accent transition-colors focus-ring rounded px-1"
                  >
                    bring back
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </Shell>
    );
  }

  // ---- before: nothing to do ----
  if (candidates.length === 0) {
    return (
      <Shell>
        <p className="text-sm text-foreground-muted">
          Nothing has sat unanswered for {AMNESTY_DAYS} days. There is nothing to let go of.
        </p>
      </Shell>
    );
  }

  // ---- before: the offer ----
  return (
    <Shell>
      <div>
        <p className="text-sm font-semibold text-foreground">
          {candidates.length} {candidates.length === 1 ? "loop has" : "loops have"} sat unanswered for over {AMNESTY_DAYS} days.
        </p>
        <p className="text-2xs text-foreground-muted mt-0.5">
          You have not decided on {candidates.length === 1 ? "it" : "them"} in three weeks. That is the decision.
        </p>
      </div>

      <ul className="space-y-1.5">
        {candidates.slice(0, confirming ? candidates.length : 5).map((t) => (
          <li key={t.id} className="flex items-baseline gap-2 text-sm">
            <span className="flex-1 truncate text-foreground-muted">{t.title}</span>
            <span className="text-2xs number-mono text-foreground-subtle">{daysSince(t.created_at)}d</span>
          </li>
        ))}
        {!confirming && candidates.length > 5 && (
          <li className="text-2xs text-foreground-subtle">and {candidates.length - 5} more</li>
        )}
      </ul>

      {confirming ? (
        <div className="flex items-center gap-2">
          <button
            onClick={go}
            disabled={busy}
            className="h-9 px-4 rounded-xl bg-state-overdue text-white text-sm font-semibold hover:opacity-90 transition-opacity focus-ring disabled:opacity-50"
          >
            {busy ? "Letting go…" : `Let go of all ${candidates.length}`}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="h-9 px-3 rounded-xl text-sm font-semibold text-foreground-muted hover:bg-base-overlay transition-colors focus-ring"
          >
            Keep them
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="h-9 px-4 rounded-xl bg-base-raised text-foreground text-sm font-semibold hover:bg-base-overlay transition-colors focus-ring self-start"
        >
          Review and let go
        </button>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-base-border bg-base-surface p-5 flex flex-col gap-3">
      <p className="text-2xs uppercase tracking-[0.2em] text-foreground-subtle font-bold">Amnesty</p>
      {children}
    </div>
  );
}
