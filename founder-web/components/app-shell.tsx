"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Sheet } from "@/components/ui/sheet";
import { signOut } from "@/lib/actions";
import { Meter } from "@/components/ui/card";
import type { UserProfile } from "@/lib/supabase/types";

export type TodaySummary = { completed_today_count: number; due_today_count: number };

const primaryItems = [
  { href: "/today", label: "Today", icon: SunIcon },
  { href: "/inbox", label: "Inbox", icon: InboxIcon },
];

const workspaceItems = [
  { href: "/notes", label: "Notes", icon: NoteIcon },
  { href: "/journal", label: "Reflect", icon: BookIcon },
];

const systemItems = [
  { href: "/focus", label: "Focus", icon: TimerIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

const allItems = [...primaryItems, ...workspaceItems, ...systemItems];

export function AppShell({ children, profile, summary, onQuickAdd }: { children: React.ReactNode; profile: UserProfile | null; summary?: TodaySummary; onQuickAdd: () => void }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Desktop glass rail */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-base-border glass-surface h-screen sticky top-0">
        <div className="h-16 flex items-center px-5 gap-2.5">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-extrabold text-white bg-gradient-to-br from-accent to-accent-glow font-display">F</span>
          <span className="font-bold text-[17px] tracking-tight text-foreground font-display">Founder<span className="text-gradient">OS</span></span>
        </div>

        <div className="px-4 pb-2">
          <button onClick={onQuickAdd} aria-label="Capture"
            className="w-full h-11 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 bg-gradient-to-br from-accent-600 to-accent-700 hover:shadow-glow-strong transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus-ring">
            <PlusIcon className="w-5 h-5" />
            Capture
          </button>
        </div>

        {summary && <MomentumCard summary={summary} />}

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-hide">
          <NavGroup items={primaryItems} pathname={pathname} />
          <NavGroup items={workspaceItems} pathname={pathname} label="Workspace" />
          <NavGroup items={systemItems} pathname={pathname} label="System" />
        </nav>

        <div className="p-4 border-t border-base-border">
          <UserRow profile={profile} />
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col bg-base">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 glass-surface border-b border-base-border">
          <div className="h-14 px-4 flex items-center justify-between">
            <span className="font-bold text-base text-foreground font-display">Founder<span className="text-gradient">OS</span></span>
            <button onClick={() => setMenuOpen(true)} className="w-10 h-10 rounded-xl hover:bg-white/[0.04] flex items-center justify-center focus-ring" aria-label="Menu">
              <MenuIcon className="w-5 h-5 text-foreground-muted" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-24 lg:pb-8">{children}</div>

        {/* Mobile floating dock */}
        <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-40 safe-bottom">
          <div className="glass-surface rounded-2xl px-2 py-1 flex items-center justify-around shadow-active mx-auto max-w-sm">
            {primaryItems.map((item) => <MobileNavLink key={item.href} item={item} pathname={pathname} />)}
            <button onClick={onQuickAdd} className="flex items-center justify-center w-12 h-12 -mt-6 rounded-full bg-gradient-to-br from-accent to-accent-600 shadow-glow-strong hover:shadow-glow focus-ring" aria-label="Capture">
              <PlusIcon className="w-5 h-5 text-white" />
            </button>
            <MobileNavLink item={workspaceItems[0]} pathname={pathname} />
            <MobileNavLink item={workspaceItems[1]} pathname={pathname} />
          </div>
        </nav>
      </main>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <div className="space-y-6">
          <NavGroup items={primaryItems} pathname={pathname} onClick={() => setMenuOpen(false)} />
          <NavGroup items={workspaceItems} pathname={pathname} label="Workspace" onClick={() => setMenuOpen(false)} />
          <NavGroup items={systemItems} pathname={pathname} label="System" onClick={() => setMenuOpen(false)} />
        </div>
        <div className="mt-6 pt-4 border-t border-base-border">
          <UserRow profile={profile} />
        </div>
      </Sheet>
    </div>
  );
}

function NavGroup({ items, pathname, label, onClick }: { items: typeof primaryItems; pathname: string; label?: string; onClick?: () => void }) {
  return (
    <div>
      {label && <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-foreground-subtle">{label}</p>}
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} onClick={onClick} />
        ))}
      </div>
    </div>
  );
}

function NavLink({ item, pathname, onClick }: { item: typeof primaryItems[number]; pathname: string; onClick?: () => void }) {
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  return (
    <Link href={item.href} onClick={onClick} aria-current={active ? "page" : undefined}
      className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus-ring",
        active ? "bg-accent-muted text-accent border-l-2 border-accent" : "text-foreground-muted hover:text-foreground hover:bg-white/[0.03] border-l-2 border-transparent")}>
      <item.icon className={cn("w-[18px] h-[18px]", active ? "text-accent" : "text-foreground-subtle")} />
      {item.label}
    </Link>
  );
}

function MobileNavLink({ item, pathname }: { item: typeof primaryItems[number]; pathname: string }) {
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  return (
    <Link href={item.href}
      className={cn("flex flex-col items-center justify-center w-12 h-12 text-[10px] font-semibold gap-0.5 focus-ring rounded-xl transition-colors duration-200",
        active ? "text-accent" : "text-foreground-muted")}>
      <item.icon className="w-5 h-5" />
    </Link>
  );
}

function MomentumCard({ summary }: { summary: TodaySummary }) {
  const total = summary.due_today_count + summary.completed_today_count;
  const ratio = total > 0 ? summary.completed_today_count / total : 0;
  return (
    <div className="mx-4 mb-3 p-3.5 rounded-xl glass-ambient flex items-center gap-3">
      <Meter value={ratio} size={40} strokeWidth={4}>
        <span className="text-[10px] font-extrabold text-accent number-mono">{Math.round(ratio * 100)}</span>
      </Meter>
      <div className="min-w-0">
        <p className="text-xs font-bold text-foreground truncate">Today&apos;s momentum</p>
        <p className="text-2xs text-foreground-muted">{summary.completed_today_count} of {total || 0} done</p>
      </div>
    </div>
  );
}

function UserRow({ profile }: { profile: UserProfile | null }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={profile?.display_name || "You"} color="#8B5CF6" size={36} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{profile?.display_name || "Thinker"}</p>
      </div>
      <form action={signOut}>
        <button type="submit" className="w-8 h-8 rounded-lg hover:bg-white/[0.04] flex items-center justify-center text-foreground-muted focus-ring" aria-label="Sign out">
          <LogoutIcon className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function SunIcon(p: { className?: string }) { return <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>; }
function InboxIcon(p: { className?: string }) { return <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>; }
function NoteIcon(p: { className?: string }) { return <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function TimerIcon(p: { className?: string }) { return <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function BookIcon(p: { className?: string }) { return <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>; }
function SettingsIcon(p: { className?: string }) { return <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function PlusIcon(p: { className?: string }) { return <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function MenuIcon(p: { className?: string }) { return <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>; }
function LogoutIcon(p: { className?: string }) { return <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
