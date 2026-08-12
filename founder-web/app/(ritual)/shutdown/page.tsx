import { getCompletedToday, getOpenToday, getProfile } from "@/lib/data";
import { ShutdownClient } from "./shutdown-client";

export default async function ShutdownPage() {
  const [shipped, open, profile] = await Promise.all([
    getCompletedToday(),
    getOpenToday(),
    getProfile(),
  ]);

  // `|| null`, not `?? null`: display_name is `text not null default ''`, so the
  // empty case is an empty string rather than null and `??` would pass it through.
  return <ShutdownClient shipped={shipped} open={open} name={profile?.display_name || null} />;
}
