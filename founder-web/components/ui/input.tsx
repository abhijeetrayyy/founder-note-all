"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
  trailing?: React.ReactNode;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leadingIcon, trailing, label, ...props },
  ref,
) {
  return (
    <div className={label ? "w-full" : "relative"}>
      {label && <label className="mb-1.5 block text-xs font-bold text-text-muted dark:text-dark-text-muted">{label}</label>}
      <div className="relative">
      {leadingIcon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted dark:text-dark-text-muted pointer-events-none">
          {leadingIcon}
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full h-12 rounded-xl bg-surface-alt dark:bg-dark-surface-alt border-0 px-4 text-[15px] outline-none focus:ring-2 focus:ring-primary/40 transition placeholder:text-text-muted dark:placeholder:text-dark-text-muted",
          leadingIcon && "pl-11",
          trailing && "pr-12",
          className,
        )}
        {...props}
      />
      {trailing && <div className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
    </div>
  );
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-xl bg-surface-alt dark:bg-dark-surface-alt border-0 px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-primary/40 transition placeholder:text-text-muted dark:placeholder:text-dark-text-muted resize-y",
          className,
        )}
        {...props}
      />
    );
  },
);
