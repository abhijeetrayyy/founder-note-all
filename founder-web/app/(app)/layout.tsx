import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/data";
import { AppShellClient } from "@/components/app-shell-client";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const profile = await getProfile();
  return <AppShellClient profile={profile}>{children}</AppShellClient>;
}
