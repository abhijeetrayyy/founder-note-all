"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-card bg-surface dark:bg-dark-surface border border-border dark:border-dark-border shadow-card", className)}
      {...props}
    />
  );
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("label-section px-0.5", className)}>{children}</div>;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-12">
      <div className="w-20 h-20 rounded-full bg-primary/10 dark:bg-primary/15 flex items-center justify-center text-primary">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-bold">{title}</h3>
      {subtitle && <p className="mt-2 text-sm text-text-muted dark:text-dark-text-muted max-w-sm leading-relaxed">{subtitle}</p>}
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-5 h-11 px-5 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-primary-deep transition focus-ring"
        >
          {action}
        </button>
      )}
    </div>
  );
}
