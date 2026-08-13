"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, children, id: idProp, ...props }, ref,
) {
  const generatedId = React.useId();
  const id = idProp ?? generatedId;
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block mb-1.5 text-2xs uppercase tracking-wider text-foreground-muted">{label}</label>}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={cn( "w-full h-12 rounded-xl pl-4 pr-10 text-base bg-base-raised border border-base-border text-foreground outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all appearance-none cursor-pointer",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <svg aria-hidden="true" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );
});
