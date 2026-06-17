"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger" | "tonal";
}) {
  const variants = {
    default: "bg-surface-alt dark:bg-dark-surface-alt text-text dark:text-dark-text",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    tonal: "bg-primary/10 text-primary",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 h-6 text-xs font-bold", variants[variant], className)}>
      {children}
    </span>
  );
}
