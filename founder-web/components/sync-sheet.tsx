"use client";

import { useRef, useState } from "react";
import { ago, dayKey } from "@/lib/dates";
import { useNow, useSync } from "@/lib/hooks";
import { exportJSON, importJSON } from "@/lib/store";
import { signIn, signOut, syncAvailable, syncNow } from "@/lib/sync";
import { toast } from "@/lib/toast";
import { closeSheet } from "@/lib/ui";
import { Cloud } from "./icons";
import { Sheet } from "./sheet";

export function SyncSheet() {
  const s = useSync();
  const now = useNow();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  async function go(create: boolean) {
    setBusy(true);
    setErr(null);
    const e = await signIn(email.trim(), password, create);
    setBusy(false);
    if (e) setErr(e);
    else toast("Signed in. This device is syncing.");
  }

  function download() {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `founder-os-backup-${dayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function upload(f: File) {
    try {
      const n = importJSON(await f.text());
      toast(n === 0 ? "Nothing new in that backup" : `Restored ${n} ${n === 1 ? "item" : "items"} from the backup`);
    } catch (e) {
      toast(e instanceof Error && e.message.includes("backup") ? e.message : "That file couldn't be read as a backup.");
    }
  }

  return (
    <Sheet label="Sync and backup" onClose={closeSheet}>
      <div className="px-5 pb-6 pt-5 sm:px-6">
        <h2 className="flex items-center gap-2 font-display text-[20px] font-medium tracking-tight">
          <Cloud className="h-5 w-5 text-ink-3" /> Sync &amp; backup
        </h2>
        <p className="mt-1 text-[14px] text-ink-2">
          Everything saves on this device first and works offline. Sync keeps your phone and laptop on the same list.
        </p>

        <section className="mt-5 rounded-xl border border-hair p-4">
          {!syncAvailable ? (
            <p className="text-[14px] text-ink-2">
              Sync isn&apos;t set up in this build. Add a Supabase project&apos;s URL and anon key to <code className="font-mono text-[12.5px]">.env.local</code> and run{" "}
              <code className="font-mono text-[12.5px]">supabase/schema.sql</code> — SETUP.md walks through it.
            </p>
          ) : s.email ? (
            <>
              <p className="text-[14px]">
                Signed in as <span className="font-medium">{s.email}</span>
              </p>
              <p className="mt-1 text-[13px] text-ink-2">
                {s.state === "syncing"
                  ? "Syncing…"
                  : s.state === "offline"
                    ? "Offline. Changes are saved here and will sync when you're back."
                    : s.state === "error"
                      ? null
                      : s.lastSyncedAt && now
                        ? `Last synced ${ago(s.lastSyncedAt, now)}`
                        : "Waiting to sync"}
              </p>
              {s.error && <p className="mt-2 text-[13px] text-red">{s.error}</p>}
              <div className="mt-3 flex gap-2">
                <button type="button" className="btn-ink" onClick={() => void syncNow()} disabled={s.state === "syncing"}>
                  Sync now
                </button>
                <button type="button" className="btn-quiet" onClick={() => void signOut()}>
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void go(false);
              }}
            >
              <p className="text-[14px] font-medium">Sign in to sync</p>
              <div className="mt-3 grid gap-2">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-lg border border-hair bg-sunk px-3 outline-none focus:border-pen/50"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-lg border border-hair bg-sunk px-3 outline-none focus:border-pen/50"
                />
              </div>
              {err && <p className="mt-2 text-[13px] text-red">{err}</p>}
              <div className="mt-3 flex gap-2">
                <button type="submit" className="btn-ink" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </button>
                <button type="button" className="btn-quiet" disabled={busy} onClick={() => void go(true)}>
                  Create account
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="mt-4">
          <p className="label">Backup</p>
          <p className="mt-1 text-[13.5px] text-ink-2">A file with every task and note. Restoring merges it in — the newer copy of each item wins.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn border border-hair hover:bg-sunk" onClick={download}>
              Download backup
            </button>
            <button type="button" className="btn-quiet" onClick={() => file.current?.click()}>
              Restore from file
            </button>
            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
                e.target.value = "";
              }}
            />
          </div>
        </section>
      </div>
    </Sheet>
  );
}
