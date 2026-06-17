import { getProfile } from "@/lib/data";
import { Card, SectionLabel } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold">Settings</h1>
        <p className="text-text-muted dark:text-dark-text-muted mt-1">Manage your profile and defaults.</p>
      </header>

      <Card className="p-5 space-y-4">
        <SectionLabel>PROFILE</SectionLabel>
        <SettingsForm profile={profile} />
      </Card>

      <Card className="p-5 space-y-4">
        <SectionLabel>ABOUT</SectionLabel>
        <p className="text-sm text-text-muted dark:text-dark-text-muted">
          FounderOS web app v0.1.0. Built with Next.js, Tailwind CSS, and Supabase.
        </p>
      </Card>
    </div>
  );
}
