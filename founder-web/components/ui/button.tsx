"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: ButtonVariant; size?: ButtonSize; }

export function Button({ variant = "primary", size = "md", disabled, className, children, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center font-semibold transition-all duration-200 focus-ring disabled:opacity-40 disabled:pointer-events-none disabled:transform-none";
  const sizes: Record<ButtonSize, string> = { sm: "h-9 px-4 text-xs rounded-xl gap-1.5", md: "h-11 px-5 text-sm rounded-xl gap-2", lg: "h-12 px-6 text-base rounded-xl gap-2.5" };
  const variants: Record<ButtonVariant, string> = {
    primary: "text-[#0B0B0D] bg-[#F0F0EE] hover:bg-white font-medium",
    ghost: "text-foreground hover:bg-base-raised active:bg-base-overlay border border-transparent",
    outline: "text-foreground border border-base-border hover:border-accent/30 hover:bg-accent-muted",
    danger: "text-state-overdue hover:bg-state-overdue/5 border border-transparent",
  };
  return <button disabled={disabled} className={cn(base, variants[variant], sizes[size], className)} {...props}>{children}</button>;
}
