import Link from "next/link";
import { getProfile, getTasksDueToday, getHabits, getHabitLogsForDate, getEnergyLog, getNotes, getGoals, getTodaySummary, getDailyPlan, getPressure, getAntiList, getMomentum } from "@/lib/data";
import { todayKey } from "@/lib/utils";
import { readPrefs } from "@/lib/loops";
import { TodayClient } from "./today-client";
import type { Task, Note, Goal, Habit, HabitLog, DailyPlan, EnergyLog, UserProfile } from "@/lib/supabase/types";

export default async function TodayPage() {
  const [profile, tasks, habits, habitLogs, energy, notes, goals, summary, plan, pressure, antiList, momentum] = await Promise.all([
    getProfile(),
    getTasksDueToday(),
    getHabits(),
    getHabitLogsForDate(),
    getEnergyLog(),
    getNotes(),
    getGoals(),
    getTodaySummary(),
    getDailyPlan(),
    getPressure(),
    getAntiList(),
    getMomentum(),
  ]);

  const mitIds = plan?.mit_task_ids ?? [];
  const mits = tasks.filter((t) => mitIds.includes(t.id));
  const rest = tasks.filter((t) => !mitIds.includes(t.id));
  const currentEnergy = energy?.level ?? profile?.energy_default ?? 1;
  const name = profile?.display_name || null;

  return (
    <TodayClient
      name={name}
      energy={currentEnergy}
      plan={plan}
      mits={mits}
      restTasks={rest}
      habits={habits}
      habitLogs={habitLogs}
      goals={goals}
      notes={notes}
      summary={summary}
      pressure={pressure}
      antiList={antiList}
      momentum={momentum}
      capacity={readPrefs(profile?.preferences).capacity}
    />
  );
}
