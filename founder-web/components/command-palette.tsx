"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState(0);
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { inputRef.current?.focus(); }, []);

  const allCommands: Command[] = React.useMemo(() => [
    { id: "today", label: "Go to Today", shortcut: "⌘1", action: () => router.push("/today") },
    { id: "inbox", label: "Go to Inbox", shortcut: "⌘2", action: () => router.push("/inbox") },
    { id: "notes", label: "Go to Notes", shortcut: "⌘3", action: () => router.push("/notes") },
    { id: "journal", label: "Go to Reflect", shortcut: "⌘4", action: () => router.push("/journal") },
    { id: "focus", label: "Start Focus Timer", action: () => router.push("/focus") },
    { id: "plan", label: "Plan Your Day", action: () => router.push("/plan") },
    { id: "goals", label: "Go to Goals", action: () => router.push("/goals") },
    { id: "habits", label: "Go to Habits", action: () => router.push("/habits") },
    { id: "projects", label: "Go to Projects", action: () => router.push("/projects") },
    { id: "stats", label: "View Stats", action: () => router.push("/stats") },
    { id: "review", label: "Weekly Review", action: () => router.push("/review") },
    { id: "settings", label: "Settings", action: () => router.push("/settings") },
    { id: "signout", label: "Sign Out", action: () => {} },
  ], [router]);

  const filtered = allCommands.filter(c =>
    !query || c.label.toLowerCase().includes(query.toLowerCase())
  );

  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter") { e.preventDefault(); filtered[selected]?.action(); onClose(); }
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [filtered, selected, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-base-surface rounded-2xl shadow-focused border border-base-border overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-base-border">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground-subtle"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Search or type a command..."
            className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-foreground-subtle outline-none"
          />
          <kbd className="text-2xs text-foreground-subtle font-mono px-2 py-0.5 rounded-md bg-base-raised border border-base-border">esc</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={() => { cmd.action(); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${i === selected ? "bg-accent-muted text-accent" : "text-foreground-muted hover:bg-white/[0.03]"}`}
            >
              <span className="flex-1 text-left">{cmd.label}</span>
              {cmd.shortcut && <kbd className="text-2xs text-foreground-subtle font-mono">{cmd.shortcut}</kbd>}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-foreground-muted text-center py-8">No results</p>
          )}
        </div>
      </div>
    </div>
  );
}
