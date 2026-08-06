import { getProfile } from "@/lib/data";
import { Card, SectionLabel } from "@/components/ui/card";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground tracking-tight font-display">Settings</h1>
        <p className="text-sm text-foreground-muted mt-1">Manage your profile and preferences.</p>
      </header>

      <Card variant="ambient" className="p-5 space-y-4">
        <SectionLabel>Profile</SectionLabel>
        <SettingsClient profile={profile} />
      </Card>

      <Card variant="ambient" className="p-5 space-y-4">
        <SectionLabel>About</SectionLabel>
        <p className="text-sm text-foreground-muted">
          FounderOS v0.1.0. Built with Next.js, Tailwind CSS, and Supabase.
        </p>
      </Card>
    </div>
  );
}
