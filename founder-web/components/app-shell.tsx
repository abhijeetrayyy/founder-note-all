"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/ui/sheet";
import { signOut } from "@/lib/actions";
import { EMPTY_PRESSURE, type Pressure } from "@/lib/loops";
import type { UserProfile } from "@/lib/supabase/types";

/**
 * The app shell, built to the handoff.
 *
 * 252px rail on #FBF8F2 against a #F6F3EC ground, nav grouped by loop stage,
 * a 60px sticky header carrying the screen title and the energy chip. Measures,
 * radii and type sizes are taken from `FounderOS App v2.dc.html` rather than
 * approximated.
 */

type NavItem = { href: string; label: string; icon: React.FC<IconProps>; badge?: string };
type NavGroupDef = { label: string; items: NavItem[] };

const NAV: NavGroupDef[] = [
  { label: "Commit", items: [
    { href: "/today", label: "Today", icon: SunIcon },
    { href: "/plan", label: "Morning plan", icon: SunriseIcon, badge: "60s" },
  ]},
  { label: "Clarify", items: [
    { href: "/inbox", label: "Triage", icon: InboxIcon },
    { href: "/loops", label: "All loops", icon: CheckSquareIcon },
    { href: "/unblock", label: "Unblock", icon: UserPlusIcon },
    { href: "/projects", label: "Projects", icon: FolderIcon },
    { href: "/notes", label: "Notes", icon: FileTextIcon },
  ]},
  { label: "Execute & close", items: [
    { href: "/focus", label: "Focus", icon: TimerIcon },
    { href: "/shutdown", label: "Shutdown", icon: MoonIcon, badge: "7pm" },
    { href: "/journal", label: "Reflect", icon: NotebookIcon },
  ]},
  { label: "Review", items: [
    { href: "/review", label: "Weekly review", icon: CalendarCheckIcon, badge: "fri" },
    { href: "/stats", label: "Pulse", icon: ActivityIcon },
    { href: "/goals", label: "90-day goals", icon: CompassIcon },
    { href: "/habits", label: "Rituals", icon: FlameIcon },
  ]},
  { label: "System", items: [
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ]},
];

/** Screen titles and their sub-line, per the handoff's TITLES map. */
const TITLES: Record<string, [string, string]> = {
  "/today": ["Today", ""],
  "/plan": ["Morning plan", "60 seconds"],
  "/inbox": ["Triage", ""],
  "/loops": ["Loops", ""],
  "/unblock": ["Unblock", ""],
  "/projects": ["Projects", ""],
  "/notes": ["Notes", ""],
  "/focus": ["Focus", "session"],
  "/shutdown": ["Shutdown", "2 minutes"],
  "/journal": ["Reflect", ""],
  "/review": ["Weekly review", ""],
  "/stats": ["Pulse", "last 30 days"],
  "/goals": ["90-day goals", ""],
  "/habits": ["Rituals", ""],
  "/settings": ["Settings", ""],
  "/tasks": ["Tasks", ""],
};

export function AppShell({ children, profile, pressure, energy = 1, onQuickAdd }: { children: React.ReactNode; profile: UserProfile | null; pressure?: Pressure; energy?: number; onQuickAdd: () => void }) {
  const pathname = usePathname() ?? "";
  const [menuOpen, setMenuOpen] = React.useState(false);
  const p = pressure ?? EMPTY_PRESSURE;

  const key = Object.keys(TITLES).find((k) => pathname === k || pathname.startsWith(`${k}/`));
  const [title, meta] = TITLES[key ?? ""] ?? ["", ""];

  return (
    <div className="flex min-h-screen bg-[#F6F3EC] text-[#171512]">
      <aside className="hidden lg:flex w-[252px] flex-none border-r border-[#E6DFD2] bg-[#FBF8F2] h-screen sticky top-0 flex-col">
        <div className="h-[60px] flex items-center gap-2.5 px-[18px]">
          <span className="w-7 h-7 rounded-[9px] bg-[#5B4FE9] text-white flex items-center justify-center font-display text-[18px] leading-none">F</span>
          <span className="font-semibold text-[16px] tracking-[-0.01em]">FounderOS</span>
        </div>

        <div className="px-3.5 pb-3">
          <CaptureButton onClick={onQuickAdd} />
        </div>

        <PressureCard pressure={p} />

        <nav className="flex-1 overflow-y-auto px-2.5 pb-2.5 flex flex-col gap-[18px] scrollbar-hide">
          {NAV.map((g) => <NavGroup key={g.label} group={g} pathname={pathname} />)}
        </nav>

        <div className="p-3.5 border-t border-[#E6DFD2] flex items-center gap-2.5">
          <UserBadge profile={profile} />
          <form action={signOut} className="flex">
            <button type="submit" aria-label="Sign out" className="text-[#A69E90] hover:text-[#171512] transition-colors focus-ring rounded">
              <LogOutIcon className="w-[15px] h-[15px]" />
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-[60px] flex-none border-b border-[#E6DFD2] bg-[#F6F3EC]/[0.86] backdrop-blur-[10px] sticky top-0 z-20 flex items-center justify-between px-5 sm:px-7 gap-5">
          <div className="flex items-baseline gap-3 min-w-0">
            <button onClick={() => setMenuOpen(true)} className="lg:hidden -ml-1 mr-1 text-[#6B6459] focus-ring rounded" aria-label="Menu">
              <MenuIcon className="w-5 h-5" />
            </button>
            <h1 className="font-display text-[22px] leading-none truncate">{title}</h1>
            {meta && <span className="hidden sm:block font-mono text-[11px] text-[#9A9285] truncate">{meta}</span>}
          </div>
          <EnergyChip energy={energy} />
        </header>

        <div className="flex-1 overflow-y-auto pb-24 lg:pb-0">{children}</div>

        <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-40 safe-bottom">
          <div className="bg-[#FFFDF8] border border-[#E0D9CB] rounded-2xl px-2 py-1 flex items-center justify-around shadow-active mx-auto max-w-sm">
            <MobileLink href="/today" label="Today" icon={SunIcon} pathname={pathname} />
            <MobileLink href="/inbox" label="Triage" icon={InboxIcon} pathname={pathname} />
            <button onClick={onQuickAdd} className="flex items-center justify-center w-12 h-12 -mt-6 rounded-full bg-[#5B4FE9] shadow-glow-strong focus-ring" aria-label="Capture">
              <PlusIcon className="w-5 h-5 text-white" />
            </button>
            <MobileLink href="/review" label="Review" icon={ActivityIcon} pathname={pathname} />
            <button onClick={() => setMenuOpen(true)} className="flex items-center justify-center w-12 h-12 focus-ring rounded-xl text-[#A69E90]" aria-label="More">
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>
        </nav>
      </main>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <div className="flex flex-col gap-[18px]">
          <CaptureButton onClick={() => { setMenuOpen(false); onQuickAdd(); }} />
          {NAV.map((g) => <NavGroup key={g.label} group={g} pathname={pathname} onClick={() => setMenuOpen(false)} />)}
        </div>
      </Sheet>
    </div>
  );
}

function CaptureButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full h-[42px] rounded-xl bg-[#5B4FE9] hover:bg-[#4A3EDA] text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors focus-ring"
      style={{ boxShadow: "0 8px 18px -10px rgba(91,79,233,0.9)" }}>
      <PlusIcon className="w-[17px] h-[17px]" />
      Capture
      <span className="font-mono text-[10px] opacity-60 ml-0.5">⌘K</span>
    </button>
  );
}

/**
 * The handoff renders a single mind-pressure score here. We show the same card
 * — mono label, large numeral, bar, sub-line — but the numeral is a count of
 * loops actually waiting on an answer rather than a weighted composite, so it
 * stays a number the founder can explain and act on.
 */
function PressureCard({ pressure }: { pressure: Pressure }) {
  const needsAnswer = pressure.rotting_count + pressure.aging_count + pressure.unclear_count;
  const owed = pressure.owed_count;
  const pct = Math.min(100, needsAnswer * 12);

  return (
    <div className="mx-3.5 mb-3.5 p-3.5 rounded-[13px] bg-[#F1EDE3] border border-[#E6DFD2]">
      <div className="flex items-baseline justify-between gap-2.5">
        <p className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-[#A69E90]">Needs an answer</p>
        {owed > 0 && <p className="font-mono text-[10.5px] text-[#D9552F]">{owed} owed</p>}
      </div>
      <p className="mt-1.5 font-mono text-[26px] leading-none tracking-[-0.02em] text-[#171512]">{needsAnswer}</p>
      <div className="h-[5px] rounded-full bg-[#E1DACB] mt-[11px] overflow-hidden">
        <div className="h-[5px] rounded-full bg-[#5B4FE9] transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-[9px] text-[11.5px] leading-[1.45] text-[#8A8378]">
        {needsAnswer === 0
          ? "Nothing is waiting on you."
          : `${pressure.rotting_count} rotting · ${pressure.aging_count} aging · ${pressure.unclear_count} with no next move`}
      </p>
    </div>
  );
}

function NavGroup({ group, pathname, onClick }: { group: NavGroupDef; pathname: string; onClick?: () => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="mb-[5px] px-2.5 font-mono text-[9.5px] tracking-[0.16em] uppercase text-[#A69E90]">{group.label}</p>
      {group.items.map((it) => {
        const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
        return (
          <Link key={it.href} href={it.href} onClick={onClick} aria-current={active ? "page" : undefined}
            className={cn(
              "w-full flex items-center gap-[11px] px-2.5 py-[9px] rounded-[10px] text-[13.5px] transition-colors focus-ring",
              active ? "bg-[#EFECFE] text-[#4A3EDA] font-semibold" : "text-[#6B6459] font-medium hover:bg-[#F1EDE3]",
            )}>
            <it.icon className="w-[17px] h-[17px] flex-none" />
            <span className="truncate">{it.label}</span>
            {it.badge && <span className="ml-auto font-mono text-[10.5px] text-[#A69E90]">{it.badge}</span>}
          </Link>
        );
      })}
    </div>
  );
}

function MobileLink({ href, label, icon: Icon, pathname }: { href: string; label: string; icon: React.FC<IconProps>; pathname: string }) {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} aria-label={label}
      className={cn("flex items-center justify-center w-12 h-12 rounded-xl transition-colors focus-ring", active ? "text-[#5B4FE9]" : "text-[#A69E90]")}>
      <Icon className="w-5 h-5" />
    </Link>
  );
}

function UserBadge({ profile }: { profile: UserProfile | null }) {
  const name = profile?.display_name?.trim() || "Founder";
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "F";
  return (
    <>
      <span className="w-8 h-8 rounded-full bg-[#DCD8FC] text-[#4A3EDA] flex items-center justify-center text-[13px] font-semibold flex-none">{initials}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate">{name}</p>
        <p className="mt-px text-[11px] text-[#8A8378]">Free plan</p>
      </div>
    </>
  );
}

/** Reads the real energy log — it said "Deep energy" unconditionally before,
 *  which contradicted the picker on Today two panels away. */
function EnergyChip({ energy }: { energy: number }) {
  const map = [
    { label: "Admin energy", bg: "#E4F6F2", fg: "#0E8C7E" },
    { label: "Medium energy", bg: "#E8EFFB", fg: "#2E6BD0" },
    { label: "Deep energy", bg: "#EFECFE", fg: "#4A3EDA" },
  ];
  const e = map[energy] ?? map[1];
  return (
    <div className="hidden sm:flex items-center gap-[7px] h-[34px] px-3 rounded-[10px] text-[12.5px] font-medium flex-none"
      style={{ background: e.bg, color: e.fg }}>
      <BatteryIcon className="w-[15px] h-[15px]" />
      {e.label}
    </div>
  );
}

/* ── Icons (Lucide geometry, inlined — the handoff loads Lucide from a CDN) ── */
type IconProps = { className?: string };
const st = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function SunIcon(p: IconProps) { return <svg className={p.className} viewBox="0 0 24 24" {...st}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>; }
function SunriseIcon(p: IconProps) { return <svg className={p.className} viewBox="0 0 24 24" {...st}><path d="M12 2v6M4.9 10.9l1.4 1.4M2 18h2M20 18h2M17.7 12.3l1.4-1.4M8 6l4-4 4 4M3 22h18M16 18a4 4 0 0 0-8 0"/></svg>; }
function InboxIcon(p: IconProps) { return <svg className={p.className} viewBox="0 0 24 24" {...st}><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/></svg>; }
function CheckSquareIcon(p: IconProps) { return <svg className={p.className} viewBox="0 0 24 24" {...st}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>; }
function UserPlusIcon(p: IconProps) { return <svg className={p.className} viewBox="0 0 24 24" {...st}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>; }
function FolderIcon(p: IconProps) { return <svg className={p.className} viewBox="0 0 24 24" {...st}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>; }
function FileTextIcon(p: IconProps) { return <svg className={p.className} viewBox="0 0 24 24" {...st}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>; }
function TimerIcon(p: IconProps) { return <svg className={p.className} viewBox="0 0 24 24" {...st}><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>; }
function MoonIcon(p: IconProps) { return <svg className={p.className} viewBox="0 0 24 24" {...st}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>; }
function NotebookIcon(p: IconProps) { return <svg className={p.className} viewBox="0 0 24 24" {...st}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h7"/></svg>; }
function CalendarCheckIcon(p: IconProps) { return <svg className={p.className} viewBox="0 0 24 24" {...st}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/></svg>; }
function ActivityIcon(p: IconProps) { return <svg className={p.className} viewBox="0 0 24 24" {...st}><path d="M3 13h4l3-8 4 16 3-8h4"/></svg>; }
function CompassIcon(p: IconProps) { return <svg className={p.className} viewBox="0 0 24 24" {...st}><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>; }
function FlameIcon(p: IconProps) { return <svg className={p.className} viewBox="0 0 24 24" {...st}><path d="M12 22c3.9 0 6.5-2.6 6.5-6 0-4-3.5-5.5-3-9.5C13 8 12 10 12 10S10.5 8 9 6C7 8.5 5.5 10.5 5.5 16c0 3.4 2.6 6 6.5 6z"/></svg>; }
function SettingsIcon(p: IconProps) { return <svg className={p.className} viewBox="0 0 24 24" {...st}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg>; }
function BatteryIcon(p: IconProps) { return <svg className={p.className} viewBox="0 0 24 24" {...st}><rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2M6 10v4M10 10v4"/></svg>; }
function PlusIcon(p: IconProps) { return <svg className={p.className} viewBox="0 0 24 24" {...st} strokeWidth={2.2}><path d="M12 5v14M5 12h14"/></svg>; }
function MenuIcon(p: IconProps) { return <svg className={p.className} viewBox="0 0 24 24" {...st}><path d="M3 6h18M3 12h18M3 18h18"/></svg>; }
function LogOutIcon(p: IconProps) { return <svg className={p.className} viewBox="0 0 24 24" {...st}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>; }
