"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Sheet } from "@/components/ui/sheet";
import { signOut } from "@/lib/actions";
import type { UserProfile } from "@/lib/supabase/types";

const navItems = [
  { href: "/today", label: "Today", icon: SunIcon },
  { href: "/inbox", label: "Inbox", icon: InboxIcon },
  { href: "/tasks", label: "Tasks", icon: CheckCircleIcon },
  { href: "/notes", label: "Notes", icon: NoteIcon },
  { href: "/plan", label: "Plan", icon: CalendarIcon },
  { href: "/focus", label: "Focus", icon: TimerIcon },
  { href: "/goals", label: "Goals", icon: TargetIcon },
  { href: "/habits", label: "Habits", icon: RepeatIcon },
  { href: "/journal", label: "Journal", icon: BookIcon },
  { href: "/projects", label: "Projects", icon: FolderIcon },
  { href: "/stats", label: "Stats", icon: ChartIcon },
  { href: "/review", label: "Review", icon: RefreshIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell({
  children,
  profile,
  onQuickAdd,
}: {
  children: React.ReactNode;
  profile: UserProfile | null;
  onQuickAdd: () => void;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border dark:border-dark-border bg-surface dark:bg-dark-sidebar h-screen sticky top-0">
        <div className="h-16 flex items-center px-5 gap-2 font-extrabold text-xl text-primary">
          <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm">F</span>
          FounderOS
        </div>

        <div className="px-4 pb-3">
          <button
            onClick={onQuickAdd}
            className="w-full h-11 rounded-2xl bg-primary text-white font-semibold text-sm shadow-primary hover:bg-primary-deep transition flex items-center justify-center gap-2 focus-ring"
          >
            <PlusIcon className="w-5 h-5" />
            Quick Add
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="p-4 border-t border-border dark:border-dark-border">
          <UserRow profile={profile} />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-surface/90 dark:bg-dark-surface/90 backdrop-blur border-b border-border dark:border-dark-border">
          <div className="h-14 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-extrabold text-lg text-primary">
              <span className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center text-xs">F</span>
              FounderOS
            </div>
            <button onClick={() => setMenuOpen(true)} className="w-10 h-10 rounded-xl hover:bg-surface-alt dark:hover:bg-dark-surface-alt flex items-center justify-center focus-ring">
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-24 lg:pb-8">{children}</div>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 dark:bg-dark-surface/95 backdrop-blur border-t border-border dark:border-dark-border safe-bottom">
          <div className="flex items-center justify-around h-[calc(4rem+env(safe-area-inset-bottom))]">
            {mobileItems.map((item) => (
              <MobileNavLink key={item.href} item={item} pathname={pathname} />
            ))}
            <button
              onClick={onQuickAdd}
              className="flex flex-col items-center justify-center w-16 h-14 -mt-3 text-primary focus-ring"
              aria-label="Quick Add"
            >
              <span className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-primary">
                <PlusIcon className="w-6 h-6" />
              </span>
            </button>
          </div>
        </nav>
      </main>

      {/* Mobile menu sheet */}
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} onClick={() => setMenuOpen(false)} />
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-border dark:border-dark-border">
          <UserRow profile={profile} />
        </div>
      </Sheet>
    </div>
  );
}

function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: (typeof navItems)[number];
  pathname: string;
  onClick?: () => void;
}) {
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition focus-ring",
        active
          ? "bg-primary/10 text-primary dark:bg-primary/15"
          : "text-text dark:text-dark-text hover:bg-surface-alt dark:hover:bg-dark-surface-alt",
      )}
    >
      <item.icon className={cn("w-5 h-5", active ? "text-primary" : "text-text-muted dark:text-dark-text-muted")} />
      {item.label}
    </Link>
  );
}

function MobileNavLink({ item, pathname }: { item: (typeof navItems)[number]; pathname: string }) {
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center justify-center w-14 h-14 text-[10px] font-bold gap-1 focus-ring rounded-xl",
        active ? "text-primary" : "text-text-muted dark:text-dark-text-muted",
      )}
    >
      <item.icon className="w-5 h-5" />
      {item.label}
    </Link>
  );
}

function UserRow({ profile }: { profile: UserProfile | null }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={profile?.display_name || "User"} color="#5B4FE9" size={36} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{profile?.display_name || "Founder"}</p>
        <p className="text-xs text-text-muted dark:text-dark-text-muted truncate">{profile?.id?.slice(0, 8)}</p>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="w-9 h-9 rounded-xl hover:bg-surface-alt dark:hover:bg-dark-surface-alt flex items-center justify-center text-text-muted dark:text-dark-text-muted focus-ring"
          aria-label="Sign out"
        >
          <LogoutIcon className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

const mobileItems = navItems.filter((i) => ["/today", "/tasks", "/notes", "/settings"].includes(i.href));

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
  );
}
function InboxIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;
}
function CheckCircleIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}
function NoteIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
}
function CalendarIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function TimerIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function TargetIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
}
function RepeatIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
}
function BookIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
}
function FolderIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
}
function ChartIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function RefreshIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6"/><path d="M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>;
}
function SettingsIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
function PlusIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function MenuIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
}
function LogoutIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
