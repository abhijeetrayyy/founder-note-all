"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseSmartInput } from "@/lib/smart-input";
import { todayKey } from "@/lib/utils";
import type { EnergyLevelValue, PriorityValue, RecurrenceValue, Task, Note, Project, Goal, Habit, JournalEntry } from "@/lib/supabase/types";

/**
 * Where to send someone after they sign in.
 *
 * Only same-origin, in-app paths survive. A `next` of "//evil.com" or
 * "https://evil.com" is a protocol-relative or absolute URL that the browser
 * would happily follow off-site, which turns the login screen into an open
 * redirect — so anything that is not a plain "/path" falls back to /today.
 */
function safeNext(raw: FormDataEntryValue | null): string {
  const next = typeof raw === "string" ? raw.trim() : "";
  if (!next.startsWith("/") || next.startsWith("//")) return "/today";
  if (next === "/" || next.startsWith("/login") || next.startsWith("/signup")) return "/today";
  return next;
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "");

  const displayName = name.trim() || email.split("@")[0];

  // display_name goes in the auth metadata because the `on_auth_user_created`
  // trigger in schema.sql reads it from there when it creates the profile row.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("already registered") || m.includes("already been registered")) {
      return { error: "There is already an account on this email. Try signing in instead." };
    }
    if (m.includes("password")) {
      return { error: "Password needs to be at least 6 characters." };
    }
    return { error: error.message };
  }

  // No session means the project has email confirmation switched on. There is
  // nothing to set up yet — RLS would reject the write anyway — so tell them to
  // go and confirm rather than bouncing them into a route they cannot reach.
  if (!data.session) {
    return { success: true, needsConfirmation: true, email };
  }

  // The trigger has already created this row, so upsert. The old code used a
  // plain insert, hit a duplicate-key error, and responded by signing the new
  // user straight back out.
  const { error: profileErr } = await supabase
    .from("users_profile")
    .upsert(
      { id: data.user!.id, display_name: displayName, energy_default: 1, onboarding_completed: false, preferences: {} },
      { onConflict: "id" },
    );
  if (profileErr) return { error: profileErr.message };

  redirect("/onboarding");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Supabase returns one deliberately vague message for both a wrong password
    // and an unknown address, so that the form cannot be used to discover who
    // has an account. Keep that property, but say something a human can act on.
    if (error.message.toLowerCase().includes("invalid login credentials")) {
      return { error: "That email and password do not match." };
    }
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "Confirm your email first — check your inbox for the link we sent." };
    }
    return { error: error.message };
  }
  redirect(safeNext(formData.get("next")));
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

  const isMIT = forced === "mit" || parsed.isMIT;
  // Undated, un-prioritized captures go to the Inbox for later triage instead of
  // silently defaulting to "due today" — that's what was making /inbox permanently empty.
  const dueDate = parsed.date ? todayKey(parsed.date) : isMIT ? todayKey() : null;
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
      is_inbox: !isMIT,
    } as Task)
    .select("*")
    .single();
  if (error) return { error: error.message };
  if (tagIds.length) await linkTaskTags((task as Task | null)?.id ?? "", tagIds);

  if (isMIT) {
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
  const { data } = await supabase.from("projects").select("id").eq("user_id", userId).ilike("name", hint).limit(1).maybeSingle();
  return data?.id ?? null;
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

export async function updateTask(id: string, updates: { priority?: number; is_inbox?: boolean; title?: string; description?: string; due_date?: string | null; project_id?: string | null; energy_level?: number; estimated_minutes?: number | null; first_step?: string; implementation_intention?: string; recurrence?: number }) {
  const supabase = await createClient();
  const cleanUpdates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(updates)) {
    if (v !== undefined) cleanUpdates[k] = v;
  }
  if (Object.keys(cleanUpdates).length === 0) return { success: true };
  const { error } = await supabase.from("tasks").update(cleanUpdates).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/tasks");
  revalidatePath("/today");
  revalidatePath("/inbox");
  revalidatePath("/plan");
  return { success: true };
}

// ============ LOOPS ============

function revalidateLoops() {
  revalidatePath("/today");
  revalidatePath("/inbox");
  revalidatePath("/tasks");
  revalidatePath("/loops");
}

export type LoopAnswer = "do" | "schedule" | "handoff" | "drop";

/**
 * Give a loop one of the four answers.
 *
 * The important part is `answered_at`: once a loop has an answer it stops
 * decaying and stops counting as pressure. That is what makes the list able to
 * shrink without anything being deleted, and what keeps capture free — a raw
 * loop costs nothing for its first week.
 *
 * "drop" releases rather than deletes. Nothing in this app removes a founder's
 * thought on their behalf without a way back.
 */
export async function answerLoop(
  id: string,
  answer: LoopAnswer,
  opts?: { dueDate?: string | null; owedTo?: string; reason?: string },
) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const updates: Record<string, unknown> = { answered_at: now, is_inbox: false, updated_at: now };

  switch (answer) {
    case "do":
      updates.due_date = opts?.dueDate ?? todayKey();
      break;
    case "schedule":
      if (!opts?.dueDate) return { error: "Pick a day to schedule this for." };
      updates.due_date = opts.dueDate;
      break;
    case "handoff":
      if (!opts?.owedTo?.trim()) return { error: "Name who is picking this up." };
      updates.owed_to = opts.owedTo.trim();
      updates.owed_direction = 1; // you are now waiting on them
      break;
    case "drop":
      updates.released_at = now;
      updates.release_reason = opts?.reason?.trim() || "dropped in triage";
      break;
  }

  const { error } = await supabase.from("tasks").update(updates).eq("id", id);
  if (error) return { error: error.message };
  revalidateLoops();
  return { success: true };
}

/** Attach a person to a loop, or clear one by passing an empty name. */
export async function setOwed(id: string, name: string, direction: 0 | 1) {
  const supabase = await createClient();
  const clean = name.trim();
  const { error } = await supabase
    .from("tasks")
    .update({
      owed_to: clean,
      owed_direction: clean ? direction : 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateLoops();
  revalidatePath("/unblock");
  return { success: true };
}

/** Put a loop on the anti-list — named on purpose, with the reason visible. */
export async function setNotThisWeek(id: string, on: boolean, reason: string = "") {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    not_this_week: on,
    anti_reason: on ? reason.trim() : "",
    updated_at: now,
  };
  // Naming something as "not this week" is itself an answer — it stops decaying.
  // Taking it off the anti-list leaves that answer intact rather than
  // resurrecting the loop as freshly rotting.
  if (on) updates.answered_at = now;

  const { error } = await supabase.from("tasks").update(updates).eq("id", id);
  if (error) return { error: error.message };
  revalidateLoops();
  return { success: true };
}

/**
 * Park an open loop for the night.
 *
 * The next move is the whole point: an unfinished thing with a written next
 * step stops occupying the background, and one without it keeps rehearsing
 * itself at 2am. Writing it is an answer, so the loop stops decaying too.
 */
export async function parkLoop(id: string, nextMove: string) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("tasks")
    .update({
      first_step: nextMove.trim(),
      answered_at: now,
      is_inbox: false,
      updated_at: now,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateLoops();
  revalidatePath("/shutdown");
  return { success: true };
}

/**
 * Hand tomorrow its one thing, chosen tonight while the context is still warm.
 * Writes to tomorrow's plan so the morning opens on a decision already made.
 */
export async function setTomorrowOneThing(taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const tomorrow = todayKey(new Date(Date.now() + 86400000));
  const { data: existing } = await supabase.from("daily_plans").select("*").eq("id", tomorrow).single();
  const current: string[] = existing?.mit_task_ids ?? [];
  const next = current.includes(taskId) ? current : [taskId, ...current].slice(0, 3);

  const { error } = await supabase.from("daily_plans").upsert({
    id: tomorrow,
    user_id: user.id,
    intention_text: existing?.intention_text ?? "",
    blocker_notes: existing?.blocker_notes ?? "",
    reflection_text: existing?.reflection_text ?? "",
    energy_level: existing?.energy_level ?? null,
    mit_task_ids: next,
    // Deliberately false: choosing tomorrow's one thing is not the same as
    // having planned tomorrow, and the morning ritual should still run.
    morning_done: false,
    created_at: existing?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  await supabase.from("tasks")
    .update({ due_date: tomorrow, is_inbox: false, answered_at: new Date().toISOString() })
    .eq("id", taskId);

  revalidatePath("/today");
  revalidatePath("/plan");
  return { success: true };
}

/**
 * Reshape a day that already broke.
 *
 * Never records what was missed. The old plan is rewritten in place rather than
 * kept as evidence against anyone — an app that shows a founder their failed
 * morning plan at 4pm is the reason planning tools get abandoned in week three.
 */
export async function replanDay(keepIds: string[], pushIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = todayKey();
  const tomorrow = todayKey(new Date(Date.now() + 86400000));

  if (pushIds.length) {
    const { error } = await supabase
      .from("tasks")
      .update({ due_date: tomorrow, updated_at: new Date().toISOString() })
      .in("id", pushIds);
    if (error) return { error: error.message };
  }

  const { data: existing } = await supabase.from("daily_plans").select("*").eq("id", today).single();
  const { error } = await supabase.from("daily_plans").upsert({
    id: today,
    user_id: user.id,
    intention_text: existing?.intention_text ?? "",
    blocker_notes: existing?.blocker_notes ?? "",
    reflection_text: existing?.reflection_text ?? "",
    energy_level: existing?.energy_level ?? null,
    mit_task_ids: keepIds.slice(0, 3),
    morning_done: true,
    created_at: existing?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  revalidatePath("/today");
  return { success: true };
}

/** Soft drop with a way back. */
export async function releaseLoop(id: string, reason: string = "") {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      released_at: new Date().toISOString(),
      release_reason: reason.trim() || "released",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateLoops();
  return { success: true };
}

export async function restoreLoop(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ released_at: null, release_reason: "", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateLoops();
  return { success: true };
}

/**
 * Friday amnesty. Releases every raw loop past the cutoff in one motion and
 * returns what went, so the app can show a receipt instead of a silent delete.
 */
export async function runAmnesty(olderThanDays: number = 21) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("release_stale_loops", {
    p_older_than_days: olderThanDays,
    p_reason: "amnesty",
  });
  if (error) return { error: error.message };
  revalidateLoops();
  revalidatePath("/review");
  const rows = (data ?? []) as { loop_id: string; loop_title: string }[];
  return { success: true, released: rows.map((r) => ({ id: r.loop_id, title: r.loop_title })) };
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

export async function pinNote(id: string, pinned: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").update({ is_pinned: pinned }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/notes");
  revalidatePath("/today");
  return { success: true };
}

export async function archiveNote(id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").update({ is_archived: archived }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/notes");
  revalidatePath("/today");
  return { success: true };
}

export async function deleteNote(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/notes");
  revalidatePath("/today");
  return { success: true };
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

  // Atomic toggle: if row exists, delete it; if not, insert it
  const { data: existing } = await supabase
    .from("habit_logs")
    .select("id")
    .eq("habit_id", habitId)
    .eq("log_date", date)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("habit_logs").delete().eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("habit_logs").insert({
      user_id: user.id,
      habit_id: habitId,
      log_date: date,
      count: 1,
      done: true,
    });
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
  const { data: existing } = await supabase.from("daily_plans").select("mit_task_ids").eq("id", date).single();
  const { error } = await supabase.from("daily_plans").upsert({
    id: date,
    user_id: user.id,
    intention_text: String(formData.get("intention_text") ?? ""),
    blocker_notes: String(formData.get("blocker_notes") ?? ""),
    reflection_text: String(formData.get("reflection_text") ?? ""),
    energy_level: Number(formData.get("energy_level") ?? null) || null,
    mit_task_ids: existing?.mit_task_ids ?? [],
    morning_done: false,
  });
  if (error) return { error: error.message };
  revalidatePath("/plan");
  revalidatePath("/today");
  return { success: true };
}

export async function updatePlanAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const date = todayKey();
  const mitRaw = String(formData.get("mit_task_ids") ?? "").trim();
  const mitIds = mitRaw ? mitRaw.split(",").filter(Boolean) : [];
  const intention = String(formData.get("intention_text") ?? "");
  const blockers = String(formData.get("blocker_notes") ?? "");
  const reflection = String(formData.get("reflection_text") ?? "");

  const { data: existing } = await supabase.from("daily_plans").select("*").eq("id", date).single();
  const morningDone = Boolean(existing?.morning_done) || mitIds.length > 0 || intention.length > 0;

  const { error } = await supabase.from("daily_plans").upsert({
    id: date,
    user_id: user.id,
    intention_text: intention,
    blocker_notes: blockers,
    reflection_text: reflection,
    energy_level: existing?.energy_level ?? null,
    mit_task_ids: mitIds,
    morning_done: morningDone,
    created_at: existing?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  // For each MIT id, ensure the task's priority is bumped to high and is_inbox=false
  if (mitIds.length > 0) {
    await supabase
      .from("tasks")
      .update({ priority: 2, is_inbox: false })
      .in("id", mitIds);
  }

  revalidatePath("/plan");
  revalidatePath("/today");
  revalidatePath("/inbox");
  return { success: true };
}

export async function addMITAction(taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const date = todayKey();
  const { data: existing } = await supabase.from("daily_plans").select("*").eq("id", date).single();
  const currentMits: string[] = existing?.mit_task_ids ?? [];
  if (currentMits.includes(taskId)) return { success: true };
  if (currentMits.length >= 3) return { error: "Already 3 MITs" };
  const next = [...currentMits, taskId];

  const { error } = await supabase.from("daily_plans").upsert({
    id: date,
    user_id: user.id,
    intention_text: existing?.intention_text ?? "",
    blocker_notes: existing?.blocker_notes ?? "",
    reflection_text: existing?.reflection_text ?? "",
    energy_level: existing?.energy_level ?? null,
    mit_task_ids: next,
    morning_done: true,
    created_at: existing?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  await supabase.from("tasks").update({ priority: 2, is_inbox: false }).eq("id", taskId);
  revalidatePath("/plan");
  revalidatePath("/today");
  return { success: true };
}

export async function removeMITAction(taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const date = todayKey();
  const { data: existing } = await supabase.from("daily_plans").select("*").eq("id", date).single();
  const currentMits: string[] = existing?.mit_task_ids ?? [];
  const next = currentMits.filter((id) => id !== taskId);

  const { error } = await supabase.from("daily_plans").upsert({
    id: date,
    user_id: user.id,
    intention_text: existing?.intention_text ?? "",
    blocker_notes: existing?.blocker_notes ?? "",
    reflection_text: existing?.reflection_text ?? "",
    energy_level: existing?.energy_level ?? null,
    mit_task_ids: next,
    morning_done: existing?.morning_done ?? false,
    created_at: existing?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
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
  });
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
    })
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function saveFocusSession(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const taskId = String(formData.get("task_id") ?? "") || null;
    const feltRaw = formData.get("felt");
    const felt = feltRaw === null || feltRaw === "" ? null : Number(feltRaw);

    const { data, error } = await supabase.from("focus_sessions").insert({
      user_id: user.id,
      task_id: taskId,
      mode: String(formData.get("mode") ?? "pomodoro"),
      duration_minutes: Number(formData.get("duration_minutes") ?? 0),
      completed: String(formData.get("completed") ?? "true") === "true",
      intention: String(formData.get("intention") ?? ""),
      felt,
      ended_at: new Date().toISOString(),
    }).select("id").single();

    if (error) return { error: error.message };
    revalidatePath("/focus");
    revalidatePath("/stats");
    return { success: true, id: (data as { id: string } | null)?.id };
  } catch {
    return { error: "Focus sessions require the migration to be applied" };
  }
}

/**
 * Record how a block actually felt, after the fact.
 *
 * Split from saveFocusSession on purpose: the session is written the moment the
 * timer ends, so a founder who walks away still gets credit for the work. The
 * feeling is an optional second write, never a gate on the first.
 */
export async function logSessionFeel(sessionId: string, felt: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("focus_sessions").update({ felt }).eq("id", sessionId);
  if (error) return { error: error.message };
  revalidatePath("/stats");
  revalidatePath("/focus");
  return { success: true };
}

export async function saveWeeklyReview(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const weekStart = String(formData.get("week_start") ?? "");
    const { error } = await supabase.from("weekly_reviews").upsert({
      user_id: user.id,
      week_start: weekStart,
      accomplishments: String(formData.get("accomplishments") ?? ""),
      challenges: String(formData.get("challenges") ?? ""),
      next_priorities: String(formData.get("next_priorities") ?? ""),
      habits_adjustment: String(formData.get("habits_adjustment") ?? ""),
      updated_at: new Date().toISOString(),
    });
    if (error) return { error: error.message };
    revalidatePath("/review");
    return { success: true };
  } catch {
    return { error: "Weekly reviews require the migration to be applied" };
  }
}

export async function updateJournalEntry(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.from("journal_entries").update({
    content: String(formData.get("content") ?? ""),
    mood: Number(formData.get("mood") ?? 1),
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/journal");
  return { success: true };
}

export async function deleteJournalEntry(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("journal_entries").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/journal");
  return { success: true };
}

export async function toggleGoalMilestone(id: string, completed: boolean) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("goal_milestones").update({
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
    }).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/goals");
    return { success: true };
  } catch {
    return { error: "Goal milestones require the migration to be applied" };
  }
}

export async function createGoalMilestone(formData: FormData) {
  try {
    const supabase = await createClient();
    const goalId = String(formData.get("goal_id") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return { error: "Milestone title is required" };
    const { error } = await supabase.from("goal_milestones").insert({
      goal_id: goalId,
      title,
      sort_order: 0,
    });
    if (error) return { error: error.message };
    revalidatePath("/goals");
    return { success: true };
  } catch {
    return { error: "Goal milestones require the migration to be applied" };
  }
}

export async function deleteGoal(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/goals");
  return { success: true };
}

export async function updateHabit(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.from("habits").update({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    target_per_day: Number(formData.get("target_per_day") ?? 1),
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/habits");
  return { success: true };
}

export async function deleteHabit(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("habits").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/habits");
  return { success: true };
}

export async function exportUserData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const [tasks, notes, projects, habits, goals, journal] = await Promise.all([
    supabase.from("tasks").select("*"),
    supabase.from("notes").select("*"),
    supabase.from("projects").select("*"),
    supabase.from("habits").select("*"),
    supabase.from("goals").select("*"),
    supabase.from("journal_entries").select("*"),
  ]);

  return {
    tasks: tasks.data ?? [],
    notes: notes.data ?? [],
    projects: projects.data ?? [],
    habits: habits.data ?? [],
    goals: goals.data ?? [],
    journal: journal.data ?? [],
    exportedAt: new Date().toISOString(),
  };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  await supabase.from("users_profile").delete().eq("id", user.id);
  // Note: full auth user deletion requires a service_role client.
  // The user should manually delete their account via Supabase dashboard.
  redirect("/login");
}
