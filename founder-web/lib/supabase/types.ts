export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export interface UserProfileRow {
  id: string;
  display_name: string;
  avatar_url: string | null;
  energy_default: number;
  onboarding_completed: boolean;
  preferences: Json;
  created_at: string;
  updated_at: string;
}

export interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: number;
  icon_index: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface TagRow {
  id: string;
  user_id: string;
  name: string;
  color: number;
  created_at: string;
}

export interface NoteRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  color: number;
  project_id: string | null;
  is_pinned: boolean;
  is_archived: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoteTagRow {
  note_id: string;
  tag_id: string;
}

export interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  priority: number;
  completed: boolean;
  completed_at: string | null;
  due_date: string | null;
  project_id: string | null;
  parent_id: string | null;
  recurrence: number;
  energy_level: number;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  first_step: string;
  implementation_intention: string;
  is_inbox: boolean;
  // ---- loop model (migration 00003) ----
  /** Name of the person attached to this loop. Empty when nobody is waiting. */
  owed_to: string;
  /** 0 = they are waiting on you, 1 = you are waiting on them. */
  owed_direction: number;
  /** 0 = task, 1 = decision. */
  kind: number;
  decide_by: string | null;
  decision_unlock: string;
  /** When this loop was triaged. NULL = still raw; only raw loops decay. */
  answered_at: string | null;
  /** Soft drop — hidden everywhere, restorable for 30 days. */
  released_at: string | null;
  release_reason: string;
  not_this_week: boolean;
  anti_reason: string;
  created_at: string;
  updated_at: string;
}

export interface TaskTagRow {
  task_id: string;
  tag_id: string;
}

export interface ReminderRow {
  id: string;
  user_id: string;
  task_id: string;
  task_title: string;
  remind_at: string;
  notified: boolean;
  created_at: string;
}

export interface JournalEntryRow {
  id: string;
  user_id: string;
  content: string;
  mood: number;
  entry_date: string;
  created_at: string;
  updated_at: string;
}

export interface HabitRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: number;
  icon_index: number;
  target_per_day: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLogRow {
  id: string;
  user_id: string;
  habit_id: string;
  log_date: string;
  count: number;
  done: boolean;
  created_at: string;
}

export interface DailyPlanRow {
  id: string;
  user_id: string;
  mit_task_ids: string[];
  intention_text: string;
  blocker_notes: string;
  morning_done: boolean;
  reflection_text: string;
  energy_level: number | null;
  created_at: string;
  updated_at: string;
}

export interface GoalRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  color: number;
  icon_index: number;
  target_date: string | null;
  progress: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnergyLogRow {
  id: string;
  user_id: string;
  log_date: string;
  level: number;
  note: string;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      users_profile: {
        Row: UserProfileRow;
        Insert: Omit<UserProfileRow, "created_at" | "updated_at"> & Partial<Pick<UserProfileRow, "created_at" | "updated_at">>;
        Update: Partial<UserProfileRow>;
      };
      projects: {
        Row: ProjectRow;
        Insert: Omit<ProjectRow, "id" | "created_at" | "updated_at"> & Partial<Pick<ProjectRow, "id" | "created_at" | "updated_at">>;
        Update: Partial<ProjectRow>;
      };
      tags: {
        Row: TagRow;
        Insert: Omit<TagRow, "id" | "created_at"> & Partial<Pick<TagRow, "id" | "created_at">>;
        Update: Partial<TagRow>;
      };
      notes: {
        Row: NoteRow;
        Insert: Omit<NoteRow, "id" | "created_at" | "updated_at"> & Partial<Pick<NoteRow, "id" | "created_at" | "updated_at">>;
        Update: Partial<NoteRow>;
      };
      note_tags: {
        Row: NoteTagRow;
        Insert: NoteTagRow;
        Update: Partial<NoteTagRow>;
      };
      tasks: {
        Row: TaskRow;
        Insert: Omit<TaskRow, "id" | "created_at" | "updated_at"> & Partial<Pick<TaskRow, "id" | "created_at" | "updated_at">>;
        Update: Partial<TaskRow>;
      };
      task_tags: {
        Row: TaskTagRow;
        Insert: TaskTagRow;
        Update: Partial<TaskTagRow>;
      };
      reminders: {
        Row: ReminderRow;
        Insert: Omit<ReminderRow, "id" | "created_at"> & Partial<Pick<ReminderRow, "id" | "created_at">>;
        Update: Partial<ReminderRow>;
      };
      journal_entries: {
        Row: JournalEntryRow;
        Insert: Omit<JournalEntryRow, "id" | "created_at" | "updated_at"> & Partial<Pick<JournalEntryRow, "id" | "created_at" | "updated_at">>;
        Update: Partial<JournalEntryRow>;
      };
      habits: {
        Row: HabitRow;
        Insert: Omit<HabitRow, "id" | "created_at" | "updated_at"> & Partial<Pick<HabitRow, "id" | "created_at" | "updated_at">>;
        Update: Partial<HabitRow>;
      };
      habit_logs: {
        Row: HabitLogRow;
        Insert: Omit<HabitLogRow, "id" | "created_at"> & Partial<Pick<HabitLogRow, "id" | "created_at">>;
        Update: Partial<HabitLogRow>;
      };
      daily_plans: {
        Row: DailyPlanRow;
        Insert: Omit<DailyPlanRow, "created_at" | "updated_at"> & Partial<Pick<DailyPlanRow, "created_at" | "updated_at">>;
        Update: Partial<DailyPlanRow>;
      };
      goals: {
        Row: GoalRow;
        Insert: Omit<GoalRow, "id" | "created_at" | "updated_at"> & Partial<Pick<GoalRow, "id" | "created_at" | "updated_at">>;
        Update: Partial<GoalRow>;
      };
      energy_logs: {
        Row: EnergyLogRow;
        Insert: Omit<EnergyLogRow, "id" | "created_at"> & Partial<Pick<EnergyLogRow, "id" | "created_at">>;
        Update: Partial<EnergyLogRow>;
      };
    };
    Views: {
      v_today_summary: {
        Row: {
          user_id: string;
          day: string;
          inbox_count: number;
          due_today_count: number;
          completed_today_count: number;
          habits_done_today: number;
        };
      };
      v_loop_pressure: {
        Row: {
          user_id: string;
          owed_count: number;
          blocked_count: number;
          rotting_count: number;
          aging_count: number;
          unclear_count: number;
        };
      };
    };
    Functions: {
      create_next_recurring_task: { Args: { p_task_id: string }; Returns: string | null };
      add_mit: { Args: { p_date: string; p_task_id: string }; Returns: undefined };
      release_stale_loops: {
        Args: { p_older_than_days?: number; p_reason?: string };
        Returns: { loop_id: string; loop_title: string }[];
      };
      purge_released_loops: { Args: Record<string, never>; Returns: number };
    };
    Enums: Record<string, never>;
  };
}

// Convenience aliases
export type Note = NoteRow;
export type NoteInsert = Database["public"]["Tables"]["notes"]["Insert"];
export type NoteUpdate = Database["public"]["Tables"]["notes"]["Update"];
export type Task = TaskRow;
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];
export type Project = ProjectRow;
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type Tag = TagRow;
export type Reminder = ReminderRow;
export type JournalEntry = JournalEntryRow;
export type Habit = HabitRow;
export type HabitLog = HabitLogRow;
export type DailyPlan = DailyPlanRow;
export type Goal = GoalRow;
export type EnergyLog = EnergyLogRow;
export type UserProfile = UserProfileRow;

export interface FocusSession {
  id: string;
  user_id: string;
  task_id: string | null;
  mode: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  completed: boolean;
  pause_duration_seconds: number;
  /** 0 = flow, 1 = solid, 2 = fought it, 3 = wrong task for this energy. */
  felt: number | null;
  intention: string;
  created_at: string;
}

export const SESSION_FEEL = [
  { value: 0, label: "Flow — best block this week" },
  { value: 1, label: "Solid" },
  { value: 2, label: "Fought it the whole time" },
  { value: 3, label: "Wrong task for this energy" },
] as const;

export interface WeeklyReview {
  id: string;
  user_id: string;
  week_start: string;
  accomplishments: string;
  challenges: string;
  next_priorities: string;
  habits_adjustment: string;
  created_at: string;
  updated_at: string;
}

export interface GoalMilestone {
  id: string;
  goal_id: string;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

// App-level enums (matching the Flutter app)
export const EnergyLevel = { admin: 0, medium: 1, deep: 2 } as const;
export const Priority = { low: 0, medium: 1, high: 2 } as const;
export const Recurrence = { none: 0, daily: 1, weekly: 2, monthly: 3 } as const;
export const Mood = { productive: 0, neutral: 1, thoughtful: 2, stressed: 3, tired: 4 } as const;

export type EnergyLevelValue = 0 | 1 | 2;
export type PriorityValue = 0 | 1 | 2;
export type RecurrenceValue = 0 | 1 | 2 | 3;
export type MoodValue = 0 | 1 | 2 | 3 | 4;

export function energyLabel(v: EnergyLevelValue) {
  return (["Admin", "Medium", "Deep"] as const)[v];
}
export function priorityLabel(v: PriorityValue) {
  return (["Low", "Medium", "High"] as const)[v];
}
export function recurrenceLabel(v: RecurrenceValue) {
  return (["None", "Daily", "Weekly", "Monthly"] as const)[v];
}
export function moodEmoji(v: MoodValue) {
  return (["😊", "😐", "🤔", "😤", "😴"] as const)[v];
}
