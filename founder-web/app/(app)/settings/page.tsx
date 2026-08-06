import { getProfile } from "@/lib/data";
import { Card, SectionLabel } from "@/components/ui/card";
import { SettingsClient } from "./settings-client";
import Link from "next/link";

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight font-display">Settings</h1>
        <p className="text-sm text-foreground-muted">Your profile, data, and account.</p>
      </header>

      <Card variant="focused" className="p-6 space-y-6">
        <div className="space-y-1">
          <SectionLabel>Profile</SectionLabel>
          <p className="text-xs text-foreground-subtle">These details appear across FounderOS.</p>
        </div>
        <SettingsClient profile={profile} />
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/stats" className="p-4 rounded-2xl glass-ambient hover:glass-active text-center transition-all duration-300">
          <p className="text-lg font-extrabold text-accent">📊</p>
          <p className="text-xs font-semibold text-foreground-muted mt-2">Pulse</p>
        </Link>
        <Link href="/review" className="p-4 rounded-2xl glass-ambient hover:glass-active text-center transition-all duration-300">
          <p className="text-lg font-extrabold text-accent">🔄</p>
          <p className="text-xs font-semibold text-foreground-muted mt-2">Review</p>
        </Link>
        <Link href="/plan" className="p-4 rounded-2xl glass-ambient hover:glass-active text-center transition-all duration-300">
          <p className="text-lg font-extrabold text-accent">☀️</p>
          <p className="text-xs font-semibold text-foreground-muted mt-2">Plan day</p>
        </Link>
        <Link href="/focus" className="p-4 rounded-2xl glass-ambient hover:glass-active text-center transition-all duration-300">
          <p className="text-lg font-extrabold text-accent">⏱</p>
          <p className="text-xs font-semibold text-foreground-muted mt-2">Focus</p>
        </Link>
      </div>

      <Card variant="ambient" className="p-5 text-center">
        <p className="text-xs text-foreground-subtle leading-relaxed">
          FounderOS v2.0 · Built with Next.js, Tailwind CSS & Supabase
        </p>
      </Card>
    </div>
  );
}
