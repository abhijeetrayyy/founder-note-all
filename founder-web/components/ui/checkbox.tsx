"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onChange" | "size"> {
  checked: boolean;
  onChange: (v: boolean) => void;
  boxSize?: "sm" | "md" | "lg";
}

export function Checkbox({ checked, onChange, boxSize = "md", className, ...props }: CheckboxProps) {
  const sizes = { sm: "w-5 h-5", md: "w-6 h-6", lg: "w-7 h-7" };
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "shrink-0 rounded-xl border-2 flex items-center justify-center transition focus-ring",
        checked
          ? "bg-primary border-primary text-white"
          : "bg-surface dark:bg-dark-surface border-border dark:border-dark-border hover:border-primary/60",
        sizes[boxSize],
        className,
      )}
      {...props}
    >
      {checked && (
        <svg width="55%" height="55%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </button>
  );
}
