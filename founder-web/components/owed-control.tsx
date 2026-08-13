"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { setOwed } from "@/lib/actions";
import type { Task } from "@/lib/supabase/types";

/**
 * Attach a person to a loop.
 *
 * The direction is the whole point. "Priya is waiting on me" and "I am waiting
 * on Priya" are the same row to a task manager and opposite feelings to a
 * founder: one is a debt, the other is a thing you can stop carrying.
 */
export function OwedControl({ task }: { task: Task }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = React.useState(task.owed_to);
  const [direction, setDirection] = React.useState<0 | 1>((task.owed_direction === 1 ? 1 : 0));
  const [saving, setSaving] = React.useState(false);

  const dirty = name.trim() !== task.owed_to || (name.trim() !== "" && direction !== task.owed_direction);

  async function save(nextName: string, nextDir: 0 | 1) {
    setSaving(true);
    const r = await setOwed(task.id, nextName, nextDir);
    setSaving(false);
    if (r.error) { toast.show(r.error, "error"); return; }
    toast.show(nextName.trim() ? "Saved" : "Person removed", "success");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-base-border bg-base-surface p-5 space-y-3">
      <div>
        <h3 className="text-sm font-bold text-foreground">Who is this on?</h3>
        <p className="text-2xs text-foreground-muted mt-0.5">
          Loops with a person attached sort above everything else.
        </p>
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name — leave blank for nobody"
        className="w-full h-10 px-3 rounded-xl border border-base-border bg-base-raised text-sm text-foreground focus-ring"
      />

      {name.trim() !== "" && (
        <div className="flex gap-1.5" role="radiogroup" aria-label="Direction">
          <DirButton on={direction === 0} onClick={() => setDirection(0)}>
            {name.trim().split(/\s+/)[0]} is waiting on me
          </DirButton>
          <DirButton on={direction === 1} onClick={() => setDirection(1)}>
            I am waiting on {name.trim().split(/\s+/)[0]}
          </DirButton>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => save(name, direction)}
          disabled={saving || !dirty}
          className="h-9 px-4 rounded-xl bg-accent-600 text-[#0B0B0D] text-sm font-semibold hover:bg-white transition-all focus-ring disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {task.owed_to && (
          <button
            onClick={() => { setName(""); save("", 0); }}
            disabled={saving}
            className="h-9 px-3 rounded-xl text-sm font-semibold text-foreground-muted hover:bg-base-overlay transition-colors focus-ring disabled:opacity-40"
          >
            Nobody
          </button>
        )}
      </div>
    </div>
  );
}

function DirButton({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn( "flex-1 h-9 px-3 rounded-xl text-xs font-semibold transition-colors focus-ring",
        on ? "bg-accent-muted text-accent border border-accent/30" : "bg-base-raised text-foreground-muted border border-transparent hover:bg-base-overlay",
      )}
    >
      {children}
    </button>
  );
}
