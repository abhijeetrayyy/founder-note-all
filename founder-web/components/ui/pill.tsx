"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  color?: string;
  size?: "sm" | "md";
}

export function Pill({ className, active, color, size = "md", children, ...props }: PillProps) {
  const c = color ?? "#5B4FE9";
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-pill border font-semibold transition active:scale-[0.98] focus-ring",
        size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-3.5 text-sm",
        active
          ? "text-white border-transparent"
          : "border-border dark:border-dark-border text-text dark:text-dark-text hover:border-current",
        className,
      )}
      style={active ? { backgroundColor: c, borderColor: c, color: "white" } : { color: c }}
      {...props}
    >
      {children}
    </button>
  );
}

export function ChipToggle({
  label,
  icon,
  active,
  onClick,
  color = "#5B4FE9",
}: {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-9 px-3.5 inline-flex items-center gap-1.5 rounded-pill border-[1.5px] text-[13px] font-bold transition active:scale-[0.97] focus-ring",
        active ? "text-white" : "border-border dark:border-dark-border text-text dark:text-dark-text hover:border-current",
      )}
      style={
        active
          ? { backgroundColor: color, borderColor: color }
          : { color }
      }
    >
      {icon}
      {label}
    </button>
  );
}
