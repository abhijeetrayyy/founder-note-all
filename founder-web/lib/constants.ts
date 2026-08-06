export const PROJECT_COLORS = ["#5B4FE9", "#14B8A6", "#F59E0B", "#EF4444", "#7C3AED", "#3B82F6"] as const;

export const BRAND_COLOR = "#5B4FE9";

export const ENERGY_CONFIG = {
  0: { label: "Admin", color: "#14B8A6" },
  1: { label: "Medium", color: "#3B82F6" },
  2: { label: "Deep", color: "#7C3AED" },
} as const;

export const MOODS = [
  { value: 0, emoji: "😊", label: "Productive" },
  { value: 1, emoji: "😐", label: "Neutral" },
  { value: 2, emoji: "🤔", label: "Thoughtful" },
  { value: 3, emoji: "😤", label: "Stressed" },
  { value: 4, emoji: "😴", label: "Tired" },
] as const;

export const NOTE_CATEGORIES = ["General", "Idea", "Meeting", "Research"] as const;

export const HABIT_ICONS = ["★", "✦", "●", "▲", "■", "♥", "⚡", "✓"] as const;

export const FOCUS_MODES = [
  { label: "Pomodoro", minutes: 25, key: "pomodoro" },
  { label: "Deep work", minutes: 50, key: "deep_work" },
  { label: "Quick sprint", minutes: 10, key: "quick_sprint" },
] as const;

export const REVIEW_PROMPTS = [
  { key: "accomplishments", label: "What did you accomplish this week?" },
  { key: "challenges", label: "What felt hard? What felt energizing?" },
  { key: "next_priorities", label: "What are the top 3 priorities for next week?" },
  { key: "habits_adjustment", label: "What habits or systems need adjustment?" },
] as const;

export const APP_NAME = "FounderOS";
