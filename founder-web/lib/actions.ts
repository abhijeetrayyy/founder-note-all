"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseSmartInput } from "@/lib/smart-input";
import { todayKey } from "@/lib/utils";
import type { EnergyLevelValue, PriorityValue, RecurrenceValue, Task, Note, Project, Goal, Habit, HabitLog, DailyPlan, JournalEntry, EnergyLog, UserProfile } from "@/lib/supabase/types";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "");

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  if (data.user) {
    await supabase.from("users_profile").insert({
      id: data.user.id,
      display_name: name || email.split("@")[0],
      energy_default: 1,
      onboarding_completed: false,
      preferences: {},
    } as UserProfile);
  }

  redirect("/today");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/today");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function quickCapture(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const raw = String(formData.get("text") ?? "").trim();
  const forced = String(formData.get("type") ?? "auto") as "auto" | "task" | "note" | "mit";
  if (!raw) return { error: "Empty input" };

  const parsed = parseSmartInput(raw);
  const title = parsed.cleanedTitle || raw;

  const projectId = await resolveProjectHint(user.id, parsed.projectHint);
  const tagIds = await resolveTags(user.id, parsed.tags);

  if (forced === "note" || (!parsed.isTask && forced === "auto")) {
    const { data: note, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title,
        content: "",
        category: parsed.projectHint || "General",
        color: 0,
        project_id: projectId,
        is_pinned: false,
        is_archived: false,
        is_locked: false,
      } as Note)
      .select("*")
      .single();
    if (error) return { error: error.message };
    if (tagIds.length) await linkNoteTags((note as Note | null)?.id ?? "", tagIds);
    revalidatePath("/notes");
    revalidatePath("/today");
    return { success: true, type: "note", id: (note as Note | null)?.id };
  }

  const dueDate = parsed.date ? todayKey(parsed.date) : todayKey();
  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title,
      description: "",
      priority: parsed.priority ?? 1,
      completed: false,
      completed_at: null,
      due_date: dueDate,
      project_id: projectId,
      parent_id: null,
      recurrence: parsed.recurrence ?? 0,
      energy_level: parsed.energy ?? 1,
      estimated_minutes: null,
      actual_minutes: null,
      first_step: "",
      implementation_intention: "",
      is_inbox: false,
    } as Task)
    .select("*")
    .single();
  if (error) return { error: error.message };
  if (tagIds.length) await linkTaskTags((task as Task | null)?.id ?? "", tagIds);

  if (forced === "mit" || parsed.isMIT) {
    await supabase.rpc("add_mit", { p_date: todayKey(), p_task_id: (task as Task | null)?.id });
  }

  revalidatePath("/tasks");
  revalidatePath("/today");
  revalidatePath("/inbox");
  return { success: true, type: "task", id: (task as Task | null)?.id };
}

async function resolveProjectHint(userId: string, hint: string | null): Promise<string | null> {
  if (!hint) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("id").eq("user_id", userId).ilike("name", hint).single();
  return (data as Project | null)?.id ?? null;
}

async function resolveTags(userId: string, names: string[]): Promise<string[]> {
  if (!names.length) return [];
  const supabase = await createClient();
  const { data: existing } = await supabase.from("tags").select("id,name").eq("user_id", userId).in("name", names);
  const existingMap = new Map(((existing ?? []) as { id: string; name: string }[]).map((t) => [t.name, t.id]));
  const missing = names.filter((n) => !existingMap.has(n));
  if (missing.length) {
    const { data: created } = await supabase.from("tags").insert(missing.map((name) => ({ user_id: userId, name, color: 0 }))).select("id,name");
    ((created ?? []) as { id: string; name: string }[]).forEach((t) => existingMap.set(t.name, t.id));
  }
  return names.map((n) => existingMap.get(n)!).filter(Boolean);
}

async function linkNoteTags(noteId: string, tagIds: string[]) {
  const supabase = await createClient();
  await supabase.from("note_tags").insert(tagIds.map((tag_id) => ({ note_id: noteId, tag_id })));
}

async function linkTaskTags(taskId: string, tagIds: string[]) {
  const supabase = await createClient();
  await supabase.from("task_tags").insert(tagIds.map((tag_id) => ({ task_id: taskId, tag_id })));
}

export async function toggleTask(id: string, completed: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/tasks");
  revalidatePath("/today");
  revalidatePath("/inbox");
  return { success: true };
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/tasks");
  revalidatePath("/today");
  revalidatePath("/inbox");
  return { success: true };
}

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      priority: Number(formData.get("priority") ?? 1) as PriorityValue,
      completed: false,
      completed_at: null,
      due_date: String(formData.get("due_date") ?? todayKey()) || todayKey(),
      project_id: String(formData.get("project_id") ?? "") || null,
      parent_id: null,
      recurrence: Number(formData.get("recurrence") ?? 0) as RecurrenceValue,
      energy_level: Number(formData.get("energy_level") ?? 1) as EnergyLevelValue,
      estimated_minutes: Number(formData.get("estimated_minutes") ?? 0) || null,
      actual_minutes: null,
      first_step: String(formData.get("first_step") ?? ""),
      implementation_intention: String(formData.get("implementation_intention") ?? ""),
      is_inbox: false,
    } as Task)
    .select("*")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/tasks");
  revalidatePath("/today");
  return { success: true, id: (data as Task | null)?.id };
}

export async function createNote(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      title: String(formData.get("title") ?? ""),
      content: String(formData.get("content") ?? ""),
      category: String(formData.get("category") ?? "General"),
      color: 0,
      project_id: String(formData.get("project_id") ?? "") || null,
      is_pinned: false,
      is_archived: false,
      is_locked: false,
    } as Note)
    .select("*")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/notes");
  revalidatePath("/today");
  return { success: true, id: (data as Note | null)?.id };
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      color: Number(formData.get("color") ?? 0),
      icon_index: Number(formData.get("icon_index") ?? 0),
      archived: false,
    } as Project)
    .select("*")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { success: true, id: (data as Project | null)?.id };
}

export async function createGoal(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const targetDate = String(formData.get("target_date") ?? "");
  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      color: Number(formData.get("color") ?? 0),
      icon_index: Number(formData.get("icon_index") ?? 0),
      target_date: targetDate || null,
      progress: 0,
      archived: false,
    } as Goal)
    .select("*")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/goals");
  return { success: true, id: (data as Goal | null)?.id };
}

export async function updateGoalProgress(id: string, progress: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("goals").update({ progress }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/goals");
  return { success: true };
}

export async function createHabit(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("habits")
    .insert({
      user_id: user.id,
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      color: Number(formData.get("color") ?? 0),
      icon_index: Number(formData.get("icon_index") ?? 0),
      target_per_day: Number(formData.get("target_per_day") ?? 1),
      archived: false,
    } as Habit)
    .select("*")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/habits");
  return { success: true, id: (data as Habit | null)?.id };
}

export async function toggleHabit(habitId: string, date: string = todayKey()) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase.from("habit_logs").select("*").eq("habit_id", habitId).eq("log_date", date).single();
  if (existing) {
    const { error } = await supabase.from("habit_logs").delete().eq("id", (existing as HabitLog).id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("habit_logs").insert({ user_id: user.id, habit_id: habitId, log_date: date, count: 1, done: true } as HabitLog);
    if (error) return { error: error.message };
  }
  revalidatePath("/habits");
  revalidatePath("/today");
  return { success: true };
}

export async function createJournalEntry(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      user_id: user.id,
      content: String(formData.get("content") ?? ""),
      mood: Number(formData.get("mood") ?? 1),
      entry_date: String(formData.get("entry_date") ?? todayKey()),
    } as JournalEntry)
    .select("*")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/journal");
  revalidatePath("/today");
  return { success: true, id: (data as JournalEntry | null)?.id };
}

export async function saveDailyPlan(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const date = String(formData.get("date") ?? todayKey());
  const { error } = await supabase.from("daily_plans").upsert({
    id: date,
    user_id: user.id,
    intention_text: String(formData.get("intention_text") ?? ""),
    blocker_notes: String(formData.get("blocker_notes") ?? ""),
    reflection_text: String(formData.get("reflection_text") ?? ""),
    energy_level: Number(formData.get("energy_level") ?? null) || null,
    mit_task_ids: [],
    morning_done: false,
  } as unknown as DailyPlan);
  if (error) return { error: error.message };
  revalidatePath("/plan");
  revalidatePath("/today");
  return { success: true };
}

export async function saveEnergyLevel(level: number, note: string = "") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const date = todayKey();
  const { error } = await supabase.from("energy_logs").upsert({
    id: `${user.id}-${date}`,
    user_id: user.id,
    log_date: date,
    level,
    note,
  } as EnergyLog);
  if (error) return { error: error.message };
  revalidatePath("/today");
  revalidatePath("/plan");
  return { success: true };
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("users_profile")
    .update({
      display_name: String(formData.get("display_name") ?? ""),
      energy_default: Number(formData.get("energy_default") ?? 1),
      onboarding_completed: true,
    } as Partial<UserProfile>)
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}
