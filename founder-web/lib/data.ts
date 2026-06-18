import { createClient } from "@/lib/supabase/server";
import { todayKey } from "@/lib/utils";
import type { Task, Note, Project, Goal, Habit, HabitLog, DailyPlan, JournalEntry, Tag, EnergyLog, UserProfile } from "@/lib/supabase/types";

export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("users_profile").select("*").eq("id", user.id).single();
  if (error) return null;
  return data as UserProfile | null;
}

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("*").eq("archived", false).order("name");
  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
  if (error && error.code !== "PGRST116") throw error;
  return data as Project | null;
}

export async function getProjectTasks(projectId: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("completed", { ascending: true })
    .order("priority", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function getProjectNotes(projectId: string): Promise<Note[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Tag[];
}

export async function getInboxTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("is_inbox", true)
    .eq("completed", false)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function getTasks(filters?: { completed?: boolean; projectId?: string | null }): Promise<Task[]> {
  const supabase = await createClient();
  let q = supabase.from("tasks").select("*");
  if (typeof filters?.completed === "boolean") q = q.eq("completed", filters.completed);
  if (filters?.projectId) q = q.eq("project_id", filters.projectId);
  const { data, error } = await q.order("priority", { ascending: false }).order("due_date", { ascending: true }).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function getTasksDueToday(): Promise<Task[]> {
  const supabase = await createClient();
  const day = todayKey();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .or(`due_date.eq.${day},due_date.lt.${day}`)
    .eq("completed", false)
    .order("priority", { ascending: false })
    .order("energy_level", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function getNotes(): Promise<Note[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("is_archived", false)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function getNote(id: string): Promise<Note | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("notes").select("*").eq("id", id).single();
  if (error && error.code !== "PGRST116") throw error;
  return data as Note | null;
}

export async function getGoals(): Promise<Goal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("goals").select("*").eq("archived", false).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Goal[];
}

export async function getHabits(): Promise<Habit[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("habits").select("*").eq("archived", false).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Habit[];
}

export async function getHabitLogsForDate(date: string = todayKey()): Promise<HabitLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("habit_logs").select("*").eq("log_date", date);
  if (error) throw error;
  return (data ?? []) as HabitLog[];
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journal_entries").select("*").order("entry_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as JournalEntry[];
}

export async function getDailyPlan(date: string = todayKey()): Promise<DailyPlan | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("daily_plans").select("*").eq("id", date).single();
  if (error && error.code !== "PGRST116") throw error;
  return data as DailyPlan | null;
}

export async function getEnergyLog(date: string = todayKey()): Promise<EnergyLog | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("energy_logs").select("*").eq("log_date", date).single();
  if (error && error.code !== "PGRST116") throw error;
  return data as EnergyLog | null;
}

export async function getTodaySummary() {
  const supabase = await createClient();
  const day = todayKey();
  const { data, error } = await supabase.from("v_today_summary").select("*").eq("day", day).single();
  if (error && error.code !== "PGRST116") throw error;
  return (data ?? { inbox_count: 0, due_today_count: 0, completed_today_count: 0, habits_done_today: 0 }) as {
    inbox_count: number;
    due_today_count: number;
    completed_today_count: number;
    habits_done_today: number;
  };
}

export async function getStats() {
  const supabase = await createClient();
  const day = todayKey();
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const weekKey = todayKey(startOfWeek);

  const [tasks, habits, journal, energy] = await Promise.all([
    supabase.from("tasks").select("*"),
    supabase.from("habit_logs").select("*").gte("log_date", weekKey),
    supabase.from("journal_entries").select("*").gte("entry_date", weekKey),
    supabase.from("energy_logs").select("*").gte("log_date", weekKey),
  ]);

  if (tasks.error) throw tasks.error;
  if (habits.error) throw habits.error;
  if (journal.error) throw journal.error;
  if (energy.error) throw energy.error;

  const allTasks = (tasks.data ?? []) as Task[];
  const completed = allTasks.filter((t) => t.completed);
  const completedToday = allTasks.filter((t) => t.completed_at?.startsWith(day));

  return {
    totalTasks: allTasks.length,
    completedTasks: completed.length,
    completionRate: allTasks.length ? Math.round((completed.length / allTasks.length) * 100) : 0,
    completedToday: completedToday.length,
    habitsThisWeek: (habits.data ?? []).length,
    journalEntriesThisWeek: (journal.data ?? []).length,
    energyThisWeek: ((energy.data ?? []) as EnergyLog[]).map((e) => e.level),
  };
}
