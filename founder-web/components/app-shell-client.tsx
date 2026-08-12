"use client";

import * as React from "react";
import { AppShell } from "@/components/app-shell";
import { QuickAdd } from "@/components/quick-add";
import { CommandPalette } from "@/components/command-palette";
import type { Pressure } from "@/lib/loops";
import type { UserProfile } from "@/lib/supabase/types";

export function AppShellClient({ children, profile, pressure, energy }: { children: React.ReactNode; profile: UserProfile | null; pressure?: Pressure; energy?: number }) {
  const [quickOpen, setQuickOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);

  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCommandOpen(o => !o); }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") { e.preventDefault(); setQuickOpen(true); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <AppShell profile={profile} pressure={pressure} energy={energy} onQuickAdd={() => setQuickOpen(true)}>
      {children}
      <QuickAdd open={quickOpen} onClose={() => setQuickOpen(false)} />
      {commandOpen && <CommandPalette onClose={() => setCommandOpen(false)} />}
    </AppShell>
  );
}
