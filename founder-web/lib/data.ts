import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { todayKey } from "@/lib/utils";
import { EMPTY_PRESSURE, GRACE_DAYS, ROT_DAYS, RESTORE_DAYS, AMNESTY_DAYS, type Pressure, type LoopFilter } from "@/lib/loops";
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
    .is("released_at", null)
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
    .is("released_at", null)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const getTasks = cache(async (filters?: { completed?: boolean; projectId?: string | null }): Promise<Task[]> => {
  const supabase = await createClient();
  let q = supabase.from("tasks").select("*").is("released_at", null);
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
    .is("released_at", null)
    // Something named "not this week" has to actually leave the day, or the
    // anti-list is just a second place the same work nags you from.
    .eq("not_this_week", false)
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

// ============ LOOPS ============

/**
 * The pressure counts. Never a score — five numbers, each with somewhere to go.
 *
 * Falls back to all-zero rather than throwing: if the loop migration has not
 * been applied yet, the chrome should quietly say nothing instead of taking
 * down every page in the app.
 */
export const getPressure = cache(async (): Promise<Pressure> => {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.from("v_loop_pressure").select("*").single();
    if (error || !data) return EMPTY_PRESSURE;
    return {
      owed_count: data.owed_count ?? 0,
      blocked_count: data.blocked_count ?? 0,
      rotting_count: data.rotting_count ?? 0,
      aging_count: data.aging_count ?? 0,
      unclear_count: data.unclear_count ?? 0,
    };
  } catch {
    return EMPTY_PRESSURE;
  }
});

/** Raw loops past the grace period, oldest first. The aging shelf. */
export const getAgingLoops = cache(async (minDays: number = GRACE_DAYS): Promise<Task[]> => {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - minDays * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("completed", false)
    .is("released_at", null)
    .is("answered_at", null)
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw error;
  return data ?? [];
});

/** Loops with a person attached. direction 0 = they wait on you, 1 = you wait. */
export const getOwedLoops = cache(async (direction: 0 | 1): Promise<Task[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("completed", false)
    .is("released_at", null)
    .eq("owed_direction", direction)
    .neq("owed_to", "")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw error;
  return data ?? [];
});

/** The anti-list: named out loud so it stops following you around. */
export const getAntiList = cache(async (): Promise<Task[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("completed", false)
    .eq("not_this_week", true)
    .is("released_at", null)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
});

/** One loop list, filtered. Backs /loops and every link the pressure readout emits. */
export const getLoopsFiltered = cache(async (filter: LoopFilter): Promise<Task[]> => {
  const supabase = await createClient();
  const iso = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

  let q = supabase.from("tasks").select("*").eq("completed", false);

  switch (filter) {
    case "released":
      // The only view that looks at released loops rather than past them.
      q = q.not("released_at", "is", null).gte("released_at", iso(RESTORE_DAYS))
           .order("released_at", { ascending: false });
      break;
    case "owed":
      q = q.is("released_at", null).neq("owed_to", "").eq("owed_direction", 0)
           .order("created_at", { ascending: true });
      break;
    case "blocked":
      q = q.is("released_at", null).neq("owed_to", "").eq("owed_direction", 1)
           .order("created_at", { ascending: true });
      break;
    case "rotting":
      q = q.is("released_at", null).is("answered_at", null).lt("created_at", iso(ROT_DAYS))
           .order("created_at", { ascending: true });
      break;
    case "aging":
      q = q.is("released_at", null).is("answered_at", null)
           .lt("created_at", iso(GRACE_DAYS)).gte("created_at", iso(ROT_DAYS))
           .order("created_at", { ascending: true });
      break;
    case "unclear":
      // The trim happens below rather than here: v_loop_pressure counts these
      // with btrim(), and a whitespace-only first_step would otherwise show in
      // the badge but be missing from the list it links to.
      q = q.is("released_at", null).eq("is_inbox", false).not("due_date", "is", null)
           .order("due_date", { ascending: true });
      break;
    case "anti":
      q = q.is("released_at", null).eq("not_this_week", true)
           .order("updated_at", { ascending: false });
      break;
    default:
      q = q.is("released_at", null)
           .order("due_date", { ascending: true, nullsFirst: false })
           .order("created_at", { ascending: false });
  }

  const { data, error } = await q.limit(200);
  if (error) throw error;
  const rows = data ?? [];
  return filter === "unclear" ? rows.filter((t) => t.first_step.trim() === "") : rows;
});

/**
 * What a Friday amnesty would let go.
 *
 * Fetched before the button is pressed so the founder always sees exactly what
 * is about to leave. A one-click release that does not show its work first is
 * indistinguishable from the app losing your data.
 */
export const getAmnestyCandidates = cache(async (olderThanDays: number = AMNESTY_DAYS): Promise<Task[]> => {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - olderThanDays * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("completed", false)
    .is("released_at", null)
    .is("answered_at", null)
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return data ?? [];
});

/**
 * What actually shipped today.
 *
 * Assembled before the shutdown ritual asks for a single word. Founders
 * routinely finish more than they remember, and being shown the evidence is
 * most of what makes stopping feel allowed.
 */
export const getCompletedToday = cache(async (): Promise<Task[]> => {
  const supabase = await createClient();
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("completed", true)
    .is("released_at", null)
    .gte("completed_at", start.toISOString())
    .order("completed_at", { ascending: true })
    .limit(50);
  if (error) throw error;
  return data ?? [];
});

/** Still open and committed to today — the loops shutdown has to park. */
export const getOpenToday = cache(async (): Promise<Task[]> => {
  const supabase = await createClient();
  const day = todayKey();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("completed", false)
    .is("released_at", null)
    .eq("not_this_week", false)
    .lte("due_date", day)
    .order("energy_level", { ascending: false })
    // Deterministic tiebreak. Without it Postgres is free to return ties in any
    // order, and each park revalidates the list — so rows reshuffle under the
    // founder's finger while they are tapping down the page.
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(50);
  if (error) throw error;
  return data ?? [];
});

/** Recently released loops, for the receipt and the restore window. */
export const getReleasedLoops = cache(async (): Promise<Task[]> => {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - RESTORE_DAYS * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .not("released_at", "is", null)
    .gte("released_at", cutoff)
    .order("released_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
});

/**
 * Energy truth: planned energy against how blocks actually felt, by weekday.
 *
 * This is the only place the app can learn it was wrong. Capacity is currently
 * an asserted constant; without this it stays asserted forever.
 *
 * Returns null until there is enough evidence to say something honest — a
 * pattern drawn from three sessions is a coincidence, not a shape.
 */
export const getEnergyTruth = cache(async (): Promise<{
  byDay: { day: string; sessions: number; good: number; rough: number }[];
  worstDay: string | null;
  bestDay: string | null;
  total: number;
} | null> => {
  const supabase = await createClient();
  const since = new Date(Date.now() - 60 * 86_400_000).toISOString();

  const { data, error } = await supabase
    .from("focus_sessions")
    .select("felt, started_at, created_at")
    .not("felt", "is", null)
    .gte("created_at", since)
    .limit(500);
  if (error || !data) return null;

  const rows = data as { felt: number | null; started_at: string | null; created_at: string }[];
  if (rows.length < 5) return null;

  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const buckets = names.map((day) => ({ day, sessions: 0, good: 0, rough: 0 }));

  for (const r of rows) {
    const d = new Date(r.started_at ?? r.created_at).getDay();
    const b = buckets[d];
    b.sessions += 1;
    // 0 flow / 1 solid read as the block working; 2 fought it / 3 wrong task do not.
    if (r.felt !== null && r.felt <= 1) b.good += 1; else b.rough += 1;
  }

  const rated = buckets.filter((b) => b.sessions >= 2);
  const best = [...rated].sort((a, b) => b.good / b.sessions - a.good / a.sessions)[0];
  const worst = [...rated].sort((a, b) => a.good / a.sessions - b.good / b.sessions)[0];

  return {
    byDay: buckets,
    total: rows.length,
    bestDay: best && best.good / best.sessions > 0.5 ? best.day : null,
    worstDay: worst && worst.good / worst.sessions < 0.5 ? worst.day : null,
  };
});

/**
 * Momentum — the quiet evidence that this is working.
 *
 * Deliberately not a streak in the gamified sense: no fire icons, no "don't
 * break the chain", and a missed day does not zero anything. It answers one
 * question a founder actually asks — has this been doing anything for me? —
 * and the answer survives a bad week.
 */
export const getMomentum = cache(async () => {
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const { data, error } = await supabase
    .from("tasks")
    .select("completed_at, created_at")
    .eq("completed", true)
    .is("released_at", null)
    .gte("completed_at", since)
    .limit(500);
  if (error || !data) return { closingDays: 0, run: 0, last7: 0, oldestClosed: 0 };

  const rows = data as { completed_at: string | null; created_at: string }[];
  const days = new Set(rows.filter((r) => r.completed_at).map((r) => r.completed_at!.slice(0, 10)));

  // Consecutive days ending today, tolerating today not having happened yet —
  // a run should not read as broken at 9am.
  const key = (d: Date) => d.toISOString().slice(0, 10);
  const cursor = new Date();
  if (!days.has(key(cursor))) cursor.setTime(cursor.getTime() - 86_400_000);
  let run = 0;
  while (days.has(key(cursor))) { run++; cursor.setTime(cursor.getTime() - 86_400_000); }

  const weekAgo = Date.now() - 7 * 86_400_000;
  const last7 = rows.filter((r) => r.completed_at && new Date(r.completed_at).getTime() >= weekAgo).length;

  // The single most satisfying number in the app: the age of the oldest thing
  // you managed to finish. That is the one that was actually weighing.
  const oldestClosed = Math.max(0, ...rows
    .filter((r) => r.completed_at && new Date(r.completed_at).getTime() >= weekAgo)
    .map((r) => Math.floor((new Date(r.completed_at!).getTime() - new Date(r.created_at).getTime()) / 86_400_000)));

  return { closingDays: days.size, run, last7, oldestClosed };
});

/** Loops closed in the last n days, split by whether they had been open a while. */
export const getClosureEvidence = cache(async (days = 30) => {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("tasks")
    .select("created_at, completed_at")
    .eq("completed", true)
    .is("released_at", null)
    .gte("completed_at", since)
    .limit(500);
  if (error || !data) return { closed: 0, closedOld: 0, released: 0 };

  const rows = data as { created_at: string; completed_at: string | null }[];
  const closedOld = rows.filter((t) =>
    t.completed_at &&
    new Date(t.completed_at).getTime() - new Date(t.created_at).getTime() >= GRACE_DAYS * 86_400_000,
  ).length;

  const { count } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .not("released_at", "is", null)
    .gte("released_at", since);

  return { closed: rows.length, closedOld, released: count ?? 0 };
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

/**
 * Milestones for many goals in one round trip.
 *
 * The goals page previously mapped getGoalMilestones over every goal, so ten
 * goals meant eleven serialised queries behind the page render.
 */
export const getMilestonesForGoals = cache(async (goalIds: string[]): Promise<Map<string, GoalMilestone[]>> => {
  const out = new Map<string, GoalMilestone[]>(goalIds.map((id) => [id, []]));
  if (!goalIds.length) return out;
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("goal_milestones")
      .select("*")
      .in("goal_id", goalIds)
      .order("sort_order");
    if (error) return out;
    for (const m of (data ?? []) as GoalMilestone[]) {
      out.get(m.goal_id)?.push(m);
    }
    return out;
  } catch {
    return out;
  }
});

/**
 * Projects, ordered by how stuck they are.
 *
 * A founder does not open Projects to remember what a project is called — they
 * open it to find out which one has stopped moving and who it is sitting with.
 * Alphabetical order answers neither question.
 */
export const getProjectHealth = cache(async () => {
  const supabase = await createClient();
  const [projects, { data: taskRows }] = await Promise.all([
    getProjects(),
    supabase
      .from("tasks")
      .select("project_id, completed, created_at, updated_at, answered_at, owed_to, owed_direction")
      .is("released_at", null)
      .not("project_id", "is", null)
      .limit(1000),
  ]);

  type Row = {
    project_id: string; completed: boolean; created_at: string; updated_at: string;
    answered_at: string | null; owed_to: string; owed_direction: number;
  };
  const rows = (taskRows ?? []) as Row[];
  const now = Date.now();

  return projects.map((p) => {
    const mine = rows.filter((t) => t.project_id === p.id);
    const open = mine.filter((t) => !t.completed);

    // Oldest unanswered loop is the honest "how stuck" signal — a scheduled
    // task is not stuck, it is scheduled.
    const ages = open.filter((t) => !t.answered_at)
      .map((t) => Math.floor((now - new Date(t.created_at).getTime()) / 86_400_000));
    const oldest = ages.length ? Math.max(...ages) : 0;

    const lastTouch = mine.length
      ? Math.floor((now - Math.max(...mine.map((t) => new Date(t.updated_at).getTime()))) / 86_400_000)
      : null;

    const blockedOn = [...new Set(
      open.filter((t) => t.owed_to.trim() && t.owed_direction === 1).map((t) => t.owed_to.trim()),
    )];
    const owedByYou = open.filter((t) => t.owed_to.trim() && t.owed_direction === 0).length;

    return {
      project: p,
      open: open.length,
      done: mine.length - open.length,
      oldestDays: oldest,
      idleDays: lastTouch,
      blockedOn,
      owedByYou,
      // Stuck-ness: age of the oldest unanswered loop, plus a penalty for
      // sitting untouched, plus weight for anything a person is waiting on.
      stuck: oldest + (lastTouch ?? 0) + owedByYou * 5,
    };
  }).sort((a, b) => b.stuck - a.stuck);
});

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
    .is("released_at", null)
    .order("priority", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Task[];
});
