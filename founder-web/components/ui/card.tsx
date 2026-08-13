"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type CardVariant = "ambient" | "active" | "focused" | "flat";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
}

export function Card({ variant = "ambient", interactive = false, className, ...props }: CardProps) {
  const variants: Record<CardVariant, string> = {
    ambient: "glass-ambient",
    active: "glass-active",
    focused: "glass-focused",
    flat: "bg-base-raised border border-base-border",
  };
  return (
    <div
      className={cn( "rounded-card",
        variants[variant],
        interactive && "transition-all duration-300 hover:shadow-active hover:-translate-y-0.5 cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("text-2xs uppercase tracking-[0.14em] text-foreground-subtle font-bold", className)}>{children}</div>;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
  onAction,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center px-8 py-14", className)}>
      <div className="w-16 h-16 rounded-2xl bg-accent-muted flex items-center justify-center text-accent mb-4">
        {icon}
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      {subtitle && <p className="mt-1.5 text-sm text-foreground-muted max-w-sm leading-relaxed">{subtitle}</p>}
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-5 h-11 px-5 rounded-xl bg-accent-muted text-accent font-semibold text-sm hover:bg-accent-muted-strong transition-colors focus-ring"
        >
          {action}
        </button>
      )}
    </div>
  );
}

/** A dependency-free circular progress ring used for momentum, streaks, and goal/habit progress. */
export function Meter({
  value,
  size = 56,
  strokeWidth = 5,
  className,
  trackClassName,
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  children?: React.ReactNode;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  const dash = c * clamped;
  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={strokeWidth} fill="none" className={cn("stroke-base-border", trackClassName)} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={cn("stroke-accent transition-[stroke-dashoffset] duration-700 ease-out", className)}
          style={{ strokeDasharray: c, strokeDashoffset: c - dash }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}
