import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { todayKey } from "@/lib/utils";
import type { Task, Note, Project, Goal, Habit, HabitLog, DailyPlan, JournalEntry, Tag, EnergyLog, UserProfile, FocusSession, WeeklyReview, GoalMilestone } from "@/lib/supabase/types";

export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
});

export const getProfile = cache(async (): Promise<UserProfile | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("users_profile").select("*").eq("id", user.id).single();
  if (error) return null;
  return data;
});

export const getProjects = cache(async (): Promise<Project[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("*").eq("archived", false).order("name");
  if (error) throw error;
  return data ?? [];
});

export const getProject = cache(async (id: string): Promise<Project | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
});

export const getProjectTasks = cache(async (projectId: string): Promise<Task[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("completed", { ascending: true })
    .order("priority", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const getProjectNotes = cache(async (projectId: string): Promise<Note[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const getTags = cache(async (): Promise<Tag[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("*").order("name");
  if (error) throw error;
  return data ?? [];
});

export const getInboxTasks = cache(async (): Promise<Task[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("is_inbox", true)
    .eq("completed", false)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const getTasks = cache(async (filters?: { completed?: boolean; projectId?: string | null }): Promise<Task[]> => {
  const supabase = await createClient();
  let q = supabase.from("tasks").select("*");
  if (typeof filters?.completed === "boolean") q = q.eq("completed", filters.completed);
  if (filters?.projectId) q = q.eq("project_id", filters.projectId);
  const { data, error } = await q
    .order("priority", { ascending: false })
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
});

export const getTask = cache(async (id: string): Promise<Task | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").select("*").eq("id", id).single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
});

export const getTasksDueToday = cache(async (): Promise<Task[]> => {
  const supabase = await createClient();
  const day = todayKey();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .lte("due_date", day)
    .eq("completed", false)
    .order("priority", { ascending: false })
    .order("energy_level", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
});

export const getNotes = cache(async (): Promise<Note[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("is_archived", false)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
});

export const getNote = cache(async (id: string): Promise<Note | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("notes").select("*").eq("id", id).single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
});

export const getNoteTags = cache(async (noteId: string): Promise<Tag[]> => {
  const supabase = await createClient();
  const { data: links, error: linkErr } = await supabase.from("note_tags").select("tag_id").eq("note_id", noteId);
  if (linkErr) throw linkErr;
  const tagIds = (links ?? []).map((l) => l.tag_id);
  if (!tagIds.length) return [];
  const { data: tags, error: tagErr } = await supabase.from("tags").select("*").in("id", tagIds);
  if (tagErr) throw tagErr;
  return tags ?? [];
});

export const getTaskTags = cache(async (taskId: string): Promise<Tag[]> => {
  const supabase = await createClient();
  const { data: links, error: linkErr } = await supabase.from("task_tags").select("tag_id").eq("task_id", taskId);
  if (linkErr) throw linkErr;
  const tagIds = (links ?? []).map((l) => l.tag_id);
  if (!tagIds.length) return [];
  const { data: tags, error: tagErr } = await supabase.from("tags").select("*").in("id", tagIds);
  if (tagErr) throw tagErr;
  return tags ?? [];
});

export const getGoals = cache(async (): Promise<Goal[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
});

export const getHabits = cache(async (): Promise<Habit[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("habits").select("*").eq("archived", false).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const getHabitLogsForDate = cache(async (date: string = todayKey()): Promise<HabitLog[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("habit_logs").select("*").eq("log_date", date);
  if (error) throw error;
  return data ?? [];
});

export const getJournalEntries = cache(async (): Promise<JournalEntry[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .order("entry_date", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
});

export const getDailyPlan = cache(async (date: string = todayKey()): Promise<DailyPlan | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("daily_plans").select("*").eq("id", date).single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
});

export const getEnergyLog = cache(async (date: string = todayKey()): Promise<EnergyLog | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("energy_logs").select("*").eq("log_date", date).single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
});

export const getTodaySummary = cache(async () => {
  const supabase = await createClient();
  const day = todayKey();
  const { data, error } = await supabase.from("v_today_summary").select("*").eq("day", day).single();
  if (error && error.code !== "PGRST116") throw error;
  return data ?? { inbox_count: 0, due_today_count: 0, completed_today_count: 0, habits_done_today: 0 };
});

export const getStats = cache(async () => {
  const supabase = await createClient();
  const day = todayKey();
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const weekKey = todayKey(startOfWeek);

  const [
    { count: totalTasks },
    { count: completedTasks },
    { count: completedToday },
    { count: habitsThisWeek },
    { count: journalEntriesThisWeek },
    energyResult,
  ] = await Promise.all([
    supabase.from("tasks").select("*", { count: "exact", head: true }),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("completed", true),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("completed", true).gte("completed_at", day),
    supabase.from("habit_logs").select("*", { count: "exact", head: true }).gte("log_date", weekKey),
    supabase.from("journal_entries").select("*", { count: "exact", head: true }).gte("entry_date", weekKey),
    supabase.from("energy_logs").select("level").gte("log_date", weekKey).order("log_date", { ascending: true }),
  ]);

  if (energyResult.error) throw energyResult.error;

  // Compute completion by day of week for the past 7 days
  const completionByDay = [0, 0, 0, 0, 0, 0, 0];
  const { data: recentCompleted } = await supabase
    .from("tasks")
    .select("completed_at")
    .eq("completed", true)
    .gte("completed_at", weekKey)
    .lte("completed_at", todayKey());
  for (const t of (recentCompleted ?? [])) {
    if (t.completed_at) {
      const d = new Date(t.completed_at);
      completionByDay[d.getDay()]++;
    }
  }

  return {
    totalTasks: totalTasks ?? 0,
    completedTasks: completedTasks ?? 0,
    completionRate: totalTasks ? Math.round(((completedTasks ?? 0) / totalTasks) * 100) : 0,
    completedToday: completedToday ?? 0,
    habitsThisWeek: habitsThisWeek ?? 0,
    journalEntriesThisWeek: journalEntriesThisWeek ?? 0,
    energyThisWeek: (energyResult.data ?? []).map((e) => e.level),
    completionByDay,
  };
});

// ============ FOCUS SESSIONS ============

export const getFocusSessions = cache(async (limit = 10): Promise<FocusSession[]> => {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("focus_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as unknown as FocusSession[];
  } catch {
    return [];
  }
});

// ============ WEEKLY REVIEWS ============

export const getWeeklyReview = cache(async (weekStart: string): Promise<WeeklyReview | null> => {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("weekly_reviews")
      .select("*")
      .eq("week_start", weekStart)
      .single();
    if (error && error.code !== "PGRST116") return null;
    return (data ?? null) as unknown as WeeklyReview | null;
  } catch {
    return null;
  }
});

// ============ GOAL MILESTONES ============

export const getGoalMilestones = cache(async (goalId: string): Promise<GoalMilestone[]> => {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("goal_milestones")
      .select("*")
      .eq("goal_id", goalId)
      .order("sort_order");
    if (error) return [];
    return (data ?? []) as unknown as GoalMilestone[];
  } catch {
    return [];
  }
});

// ============ TASKS FOR SELECTION ============

export const getTasksForFocus = cache(async (): Promise<Task[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id,title")
    .eq("completed", false)
    .order("priority", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Task[];
});
