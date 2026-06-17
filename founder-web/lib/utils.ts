import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** A midnight-to-midnight ISO date string (YYYY-MM-DD) in the user's local tz. */
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatTime(min: number): string {
  if (!min) return "";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function greeting(name: string): string {
  const h = new Date().getHours();
  const base =
    h < 5 ? "Late night" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  if (!name) return base;
  return `${base}, ${name}`;
}

export function relativeDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}
