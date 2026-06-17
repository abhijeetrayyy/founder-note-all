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
        Relationships: [];
      };
      projects: {
        Row: ProjectRow;
        Insert: Omit<ProjectRow, "id" | "created_at" | "updated_at"> & Partial<Pick<ProjectRow, "id" | "created_at" | "updated_at">>;
        Update: Partial<ProjectRow>;
        Relationships: [];
      };
      tags: {
        Row: TagRow;
        Insert: Omit<TagRow, "id" | "created_at"> & Partial<Pick<TagRow, "id" | "created_at">>;
        Update: Partial<TagRow>;
        Relationships: [];
      };
      notes: {
        Row: NoteRow;
        Insert: Omit<NoteRow, "id" | "created_at" | "updated_at"> & Partial<Pick<NoteRow, "id" | "created_at" | "updated_at">>;
        Update: Partial<NoteRow>;
        Relationships: [];
      };
      note_tags: {
        Row: NoteTagRow;
        Insert: NoteTagRow;
        Update: Partial<NoteTagRow>;
        Relationships: [];
      };
      tasks: {
        Row: TaskRow;
        Insert: Omit<TaskRow, "id" | "created_at" | "updated_at"> & Partial<Pick<TaskRow, "id" | "created_at" | "updated_at">>;
        Update: Partial<TaskRow>;
        Relationships: [];
      };
      task_tags: {
        Row: TaskTagRow;
        Insert: TaskTagRow;
        Update: Partial<TaskTagRow>;
        Relationships: [];
      };
      reminders: {
        Row: ReminderRow;
        Insert: Omit<ReminderRow, "id" | "created_at"> & Partial<Pick<ReminderRow, "id" | "created_at">>;
        Update: Partial<ReminderRow>;
        Relationships: [];
      };
      journal_entries: {
        Row: JournalEntryRow;
        Insert: Omit<JournalEntryRow, "id" | "created_at" | "updated_at"> & Partial<Pick<JournalEntryRow, "id" | "created_at" | "updated_at">>;
        Update: Partial<JournalEntryRow>;
        Relationships: [];
      };
      habits: {
        Row: HabitRow;
        Insert: Omit<HabitRow, "id" | "created_at" | "updated_at"> & Partial<Pick<HabitRow, "id" | "created_at" | "updated_at">>;
        Update: Partial<HabitRow>;
        Relationships: [];
      };
      habit_logs: {
        Row: HabitLogRow;
        Insert: Omit<HabitLogRow, "id" | "created_at"> & Partial<Pick<HabitLogRow, "id" | "created_at">>;
        Update: Partial<HabitLogRow>;
        Relationships: [];
      };
      daily_plans: {
        Row: DailyPlanRow;
        Insert: Omit<DailyPlanRow, "created_at" | "updated_at"> & Partial<Pick<DailyPlanRow, "created_at" | "updated_at">>;
        Update: Partial<DailyPlanRow>;
        Relationships: [];
      };
      goals: {
        Row: GoalRow;
        Insert: Omit<GoalRow, "id" | "created_at" | "updated_at"> & Partial<Pick<GoalRow, "id" | "created_at" | "updated_at">>;
        Update: Partial<GoalRow>;
        Relationships: [];
      };
      energy_logs: {
        Row: EnergyLogRow;
        Insert: Omit<EnergyLogRow, "id" | "created_at"> & Partial<Pick<EnergyLogRow, "id" | "created_at">>;
        Update: Partial<EnergyLogRow>;
        Relationships: [];
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
    };
    Functions: {
      create_next_recurring_task: { Args: { p_task_id: string }; Returns: string | null };
      add_mit: { Args: { p_date: string; p_task_id: string }; Returns: undefined };
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
