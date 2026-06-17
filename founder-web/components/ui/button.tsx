"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger" | "tonal";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-deep shadow-primary",
    ghost: "bg-transparent text-text dark:text-dark-text hover:bg-surface-alt dark:hover:bg-dark-surface-alt",
    outline: "border border-border dark:border-dark-border bg-transparent hover:bg-surface-alt dark:hover:bg-dark-surface-alt",
    danger: "bg-danger text-white hover:opacity-90",
    tonal: "bg-primary/10 text-primary hover:bg-primary/20",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-[15px]",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-ring",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
