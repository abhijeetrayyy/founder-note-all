import { redirect } from "next/navigation";
import { getUser, getProfile, getTodaySummary } from "@/lib/data";
import { AppShellClient } from "@/components/app-shell-client";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const [profile, summary] = await Promise.all([getProfile(), getTodaySummary()]);
  return <AppShellClient profile={profile} summary={summary}>{children}</AppShellClient>;
}
