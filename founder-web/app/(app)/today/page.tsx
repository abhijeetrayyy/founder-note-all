import Link from "next/link";
import { getProfile, getTasksDueToday, getTasksByIds, getOpenLoops, getHabits, getHabitLogsForDate, getEnergyLog, getNotes, getGoals, getTodaySummary, getDailyPlan, getPressure, getAntiList, getMomentum } from "@/lib/data";
import { todayKey } from "@/lib/utils";
import { readPrefs, byLane } from "@/lib/loops";
import { TodayClient } from "./today-client";
import type { Task, Note, Goal, Habit, HabitLog, DailyPlan, EnergyLog, UserProfile } from "@/lib/supabase/types";

export default async function TodayPage() {
  const [profile, tasks, habits, habitLogs, energy, notes, goals, summary, plan, pressure, antiList, momentum, open] = await Promise.all([
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
    getOpenLoops(),
  ]);

  const mitIds = plan?.mit_task_ids ?? [];
  // Fetched by id rather than sieved out of "due today". Picks are committed to
  // today when they are chosen, so the two agree — but only this read preserves
  // the order they were chosen in, and only this read still finds a pick whose
  // date was cleared or pushed from somewhere else in the app.
  const mits = await getTasksByIds(mitIds);
  const rest = tasks.filter((t) => !mitIds.includes(t.id));
  const currentEnergy = energy?.level ?? profile?.energy_default ?? 1;
  const name = profile?.display_name || null;

  // What has caught fire since the plan was made. A founder's day does not
  // survive its own morning: a customer escalates, an investor replies, a
  // deploy breaks. A Today screen that only ever shows what you chose at 9am is
  // a screen that is wrong by 11 — so anything genuinely burning that is NOT
  // among the picks gets said out loud, with the swap one click away.
  const fires = byLane(open, todayKey()).fire
    .filter(({ task }) => !mitIds.includes(task.id))
    .slice(0, 3)
    .map(({ task, why }) => ({ id: task.id, title: task.title, why }));

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
      fires={fires}
      capacity={readPrefs(profile?.preferences).capacity}
    />
  );
}
