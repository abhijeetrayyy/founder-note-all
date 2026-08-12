import { getProfile, getEnergyTruth, getFocusSessions } from "@/lib/data";
import { Card, SectionLabel } from "@/components/ui/card";
import { SettingsClient } from "./settings-client";
import { TuningForm } from "@/components/tuning-form";
import { readPrefs, observedCapacity } from "@/lib/loops";

export default async function SettingsPage() {
  const [profile, sessions] = await Promise.all([getProfile(), getFocusSessions(60)]);
  const prefs = readPrefs(profile?.preferences);

  // What the founder's real deep number looks like, from completed deep blocks
  // per day. Stays null until there is enough history to say anything honest.
  const byDay = new Map<string, number>();
  for (const s of sessions) {
    if (s.mode !== "deep_work" || !s.completed) continue;
    const key = new Date(s.started_at ?? s.created_at).toDateString();
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  const observed = observedCapacity([...byDay.values()], prefs.capacity.deep);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header>
        <p className="text-sm text-foreground-muted mt-1">
          Tuning, not configuration. Everything here should be sensible from the first minute.
        </p>
      </header>

      <Card variant="ambient" className="p-5 space-y-4">
        <SectionLabel>Profile</SectionLabel>
        <SettingsClient profile={profile} />
      </Card>

      <Card variant="ambient" className="p-5 space-y-4">
        <SectionLabel>Capacity &amp; rituals</SectionLabel>
        <TuningForm prefs={prefs} observedDeep={observed?.real ?? null} />
      </Card>
    </div>
  );
}
