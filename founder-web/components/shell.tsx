"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ago } from "@/lib/dates";
import { useNow, useShelf, useStore, useSync, useToday } from "@/lib/hooks";
import { load, runTidy } from "@/lib/store";
import { startSync, type SyncStatus } from "@/lib/sync";
import { openSync, useSheet } from "@/lib/ui";
import { Capture } from "./capture";
import { ListIcon, NoteIcon, Sun } from "./icons";
import { SyncSheet } from "./sync-sheet";
import { TaskSheet } from "./task-sheet";
import { Toaster } from "./toaster";

const TABS = [
  { href: "/", label: "Today", icon: Sun },
  { href: "/list", label: "List", icon: ListIcon },
  { href: "/notes", label: "Notes", icon: NoteIcon },
] as const;

function isActive(path: string, href: string) {
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`) || (href === "/list" && path.startsWith("/archive"));
}

function syncLabel(s: SyncStatus, now: Date | null): { text: string; dot: string } {
  switch (s.state) {
    case "off":
    case "signed-out":
      return { text: "On this device", dot: "bg-ink-3/60" };
    case "syncing":
      return { text: "Syncing…", dot: "bg-pen animate-pulse" };
    case "synced":
      return { text: s.lastSyncedAt && now ? `Synced ${ago(s.lastSyncedAt, now)}` : "Synced", dot: "bg-pen" };
    case "offline":
      return { text: "Offline — saved here", dot: "bg-amber" };
    case "error":
      return { text: "Sync failed", dot: "bg-red" };
  }
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { loaded, saveFailed } = useStore();
  const today = useToday();
  const now = useNow();
  const path = usePathname() || "/";
  const sheet = useSheet();
  const sync = useSync();
  const shelf = useShelf();

  useEffect(() => {
    load();
    void startSync();
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Housekeeping on open and again whenever the day turns over.
  useEffect(() => {
    if (loaded && today) runTidy();
  }, [loaded, today]);

  const listCount = shelf ? shelf.ranked.length + shelf.fading.length : 0;
  const s = syncLabel(sync, now);

  return (
    <div className="min-h-dvh pt-[env(safe-area-inset-top)]">
      <header className="mx-auto flex h-14 max-w-5xl items-center gap-8 px-4 sm:px-6 md:h-16">
        <Link href="/" className="flex items-center gap-2 font-display text-[17px] font-semibold tracking-tight">
          <span aria-hidden className="block h-3.5 w-5 rounded-[2px] border border-hair bg-card shadow-card">
            <span className="mt-[3px] block h-[1.5px] bg-red" />
          </span>
          FounderOS
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {TABS.map((t) => {
            const active = isActive(path, t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative rounded-lg px-3 py-2 text-[14px] font-medium transition-colors",
                  active ? "text-ink" : "text-ink-2 hover:text-ink",
                )}
              >
                {t.label}
                {t.href === "/list" && listCount > 0 && (
                  <span className="ml-1.5 font-mono text-[12px] font-normal text-ink-3">{listCount}</span>
                )}
                {active && <span className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-red" />}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={openSync}
          className="ml-auto flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-ink-2 hover:bg-card hover:text-ink"
        >
          <span className={clsx("h-2 w-2 rounded-full", s.dot)} />
          <span className={clsx(sync.state === "synced" || sync.state === "syncing" ? "hidden sm:inline" : "")}>{s.text}</span>
        </button>
      </header>

      {/* Pinned while you scroll: wherever you are in the app, the box is right there. */}
      <div className="sticky top-0 z-20 mx-auto max-w-5xl bg-desk/90 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur sm:px-6">
        <Capture />
        {saveFailed && (
          <p className="mt-3 rounded-lg border border-red/30 bg-red/5 px-3 py-2 text-[13px] text-red">
            This browser is refusing to save (private window or storage full). Changes will be lost when you close it.
          </p>
        )}
      </div>

      <main className="mx-auto max-w-5xl px-4 pb-32 pt-6 sm:px-6 md:pb-20 md:pt-8">
        {loaded && today ? children : <div className="h-64" aria-busy="true" />}
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-hair bg-desk/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-3">
          {TABS.map((t) => {
            const active = isActive(path, t.href);
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11.5px] font-medium",
                  active ? "text-ink" : "text-ink-3",
                )}
              >
                <span className="relative">
                  <Icon className="h-[21px] w-[21px]" />
                  {t.href === "/list" && listCount > 0 && (
                    <span className="absolute -right-4 -top-1.5 font-mono text-[10px] text-ink-3">{listCount}</span>
                  )}
                </span>
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <Toaster />
      {sheet?.kind === "task" && <TaskSheet key={sheet.id} id={sheet.id} rewrite={sheet.rewrite} />}
      {sheet?.kind === "sync" && <SyncSheet />}
    </div>
  );
}
