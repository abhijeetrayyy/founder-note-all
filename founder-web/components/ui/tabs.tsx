"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto scrollbar-hide pb-1", className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "h-9 px-4 rounded-pill text-sm font-bold whitespace-nowrap transition focus-ring",
            active === t.id
              ? "bg-primary text-white"
              : "bg-surface-alt dark:bg-dark-surface-alt text-text dark:text-dark-text hover:bg-surface dark:hover:bg-dark-surface",
          )}
        >
          {t.label}
          {typeof t.count === "number" && (
            <span className={cn("ml-1.5 text-xs", active === t.id ? "text-white/80" : "text-text-muted")}>({t.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
