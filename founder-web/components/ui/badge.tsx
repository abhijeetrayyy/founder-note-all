"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "tonal" | "danger" | "warning" | "success";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  const variants: Record<BadgeVariant, string> = {
    default: "bg-base-raised text-foreground-muted border-base-border",
    tonal: "bg-accent-muted text-accent border-accent-muted-strong",
    danger: "bg-state-overdue-surface text-state-overdue border-state-overdue/10",
    warning: "bg-state-attention-surface text-state-attention border-state-attention/10",
    success: "bg-state-done-surface text-state-done border-state-done/10",
  };
  return (
    <span className={cn("inline-flex items-center text-2xs font-semibold px-2.5 h-6 rounded-full border tracking-wide", variants[variant], className)}>
      {children}
    </span>
  );
}
