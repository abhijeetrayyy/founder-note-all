"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { replanDay } from "@/lib/actions";
import { energyLabel } from "@/lib/supabase/types";
import type { Task } from "@/lib/supabase/types";

/**
 * The screen for the moment the day broke.
 *
 * Founder days do not run plan → focus → shutdown; they run plan, then forty
 * Slack messages and a call that moved. By 4pm the morning plan has become a
 * monument to failure, and showing it unchanged is why planning tools get
 * abandoned in week three.
 *
 * Two rules: it reshapes the day rather than grading it, and it never displays
 * what was missed as a deficit. There is no count of what you failed to do here,
 * on purpose.
 */
export function ReplanClient({ mits, hoursAway }: { mits: Task[]; hoursAway: number }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  const hoursLabel = hoursAway >= 1 ? `${Math.round(hoursAway)} hours` : "A while";

  async function commit(key: string, keep: string[], push: string[]) {
    setBusy(key);
    const r = await replanDay(keep, push);
    setBusy(null);
    if (!r.error) router.push("/today");
  }

  const deepOnes = mits.filter((t) => t.energy_level === 2).map((t) => t.id);
  const lightOnes = mits.filter((t) => t.energy_level !== 2).map((t) => t.id);
  const allIds = mits.map((t) => t.id);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg space-y-8 animate-fade-in">
        <div>
          <p className="text-2xs uppercase tracking-[0.2em] text-foreground-subtle font-bold">Replan</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-foreground font-display">
            {hoursLabel} gone. Reshape the day?
          </h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Whatever happened, happened. Here is what is still on today.
          </p>
        </div>

        {mits.length > 0 && (
          <ul className="space-y-2">
            {mits.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-xl border border-base-border bg-base-surface p-3.5">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full flex-none",
                  t.energy_level === 2 ? "bg-energy-deep" : t.energy_level === 1 ? "bg-energy-medium" : "bg-energy-admin",
                )} />
                <span className="flex-1 text-sm text-foreground">{t.title}</span>
                <span className="text-2xs text-foreground-subtle">{energyLabel(t.energy_level as 0 | 1 | 2)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2">
          <Choice
            title="Keep going"
            body="The plan still stands. Nothing moves."
            busy={busy === "keep"}
            onClick={() => commit("keep", allIds, [])}
          />
          <Choice
            title="Make it an admin day"
            body={deepOnes.length
              ? `Push the deep work to tomorrow, keep what is light.`
              : "Nothing deep left to move — this is already an admin day."}
            busy={busy === "admin"}
            onClick={() => commit("admin", lightOnes, deepOnes)}
          />
          <Choice
            title="Start tomorrow now"
            body="Move everything to tomorrow and stop for today."
            busy={busy === "all"}
            onClick={() => commit("all", [], allIds)}
          />
        </div>

        <Link href="/today" className="inline-block text-xs text-foreground-subtle hover:text-foreground transition-colors">
          Leave it alone
        </Link>
      </div>
    </div>
  );
}

function Choice({ title, body, onClick, busy }: { title: string; body: string; onClick: () => void; busy: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="w-full text-left rounded-xl border border-base-border bg-base-surface p-4 hover:border-accent/30 hover:bg-base-raised transition-colors focus-ring disabled:opacity-50"
    >
      <p className="text-sm font-bold text-foreground">{busy ? "Saving…" : title}</p>
      <p className="mt-0.5 text-xs text-foreground-muted">{body}</p>
    </button>
  );
}
