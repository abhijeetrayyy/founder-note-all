"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, children, ...props },
  ref,
) {
  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-xs font-bold text-text-muted dark:text-dark-text-muted">{label}</label>}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "w-full h-12 rounded-xl bg-surface-alt dark:bg-dark-surface-alt border-0 px-4 pr-10 text-[15px] outline-none focus:ring-2 focus:ring-primary/40 transition appearance-none",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <svg
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted dark:text-dark-text-muted pointer-events-none"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );
});
