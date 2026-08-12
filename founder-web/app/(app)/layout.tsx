import { redirect } from "next/navigation";
import { getUser, getProfile, getPressure, getEnergyLog } from "@/lib/data";
import { AppShellClient } from "@/components/app-shell-client";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const [profile, pressure, energy] = await Promise.all([getProfile(), getPressure(), getEnergyLog()]);
  const level = energy?.level ?? profile?.energy_default ?? 1;
  return <AppShellClient profile={profile} pressure={pressure} energy={level}>{children}</AppShellClient>;
}
