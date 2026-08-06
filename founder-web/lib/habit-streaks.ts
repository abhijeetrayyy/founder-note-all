import { createClient } from "@/lib/supabase/server";
import { todayKey } from "@/lib/utils";

/**
 * Computes current streak for each habit by counting consecutive days
 * of habit logs going back from today.
 */
export async function getLastNLogs(habitIds: string[], maxDays = 60): Promise<Map<string, number>> {
  if (!habitIds.length) return new Map();
  const supabase = await createClient();
  const streakMap = new Map<string, number>();

  const today = todayKey();
  const past = new Date();
  past.setDate(past.getDate() - maxDays);
  const pastKey = todayKey(past);

  const { data, error } = await supabase
    .from("habit_logs")
    .select("habit_id,log_date")
    .in("habit_id", habitIds)
    .gte("log_date", pastKey)
    .lte("log_date", today)
    .order("log_date", { ascending: false });

  if (error) return streakMap;

  for (const habitId of habitIds) {
    const dates = new Set(
      (data ?? []).filter((r) => r.habit_id === habitId).map((r) => r.log_date)
    );

    // Count consecutive days backward from today
    let streak = 0;
    let check = new Date();
    while (dates.has(todayKey(check))) {
      streak++;
      check.setDate(check.getDate() - 1);
    }
    streakMap.set(habitId, streak);
  }

  return streakMap;
}
