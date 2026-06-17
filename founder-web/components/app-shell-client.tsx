"use client";

import * as React from "react";
import { AppShell } from "@/components/app-shell";
import { QuickAdd } from "@/components/quick-add";
import type { UserProfile } from "@/lib/supabase/types";

export function AppShellClient({ children, profile }: { children: React.ReactNode; profile: UserProfile | null }) {
  const [quickOpen, setQuickOpen] = React.useState(false);
  return (
    <AppShell profile={profile} onQuickAdd={() => setQuickOpen(true)}>
      {children}
      <QuickAdd open={quickOpen} onClose={() => setQuickOpen(false)} />
    </AppShell>
  );
}
