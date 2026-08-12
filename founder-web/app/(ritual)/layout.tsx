import { redirect } from "next/navigation";
import { getUser } from "@/lib/data";

/**
 * Rituals live outside the app shell on purpose.
 *
 * No sidebar, no nav, no counts. A guided moment that still shows you eleven
 * other places you could be is not a guided moment — it is a page with a
 * wizard on it, and the founder will wander off mid-flow.
 */
export default async function RitualLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");
  return <div className="min-h-screen">{children}</div>;
}
