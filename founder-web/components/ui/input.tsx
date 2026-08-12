"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { leadingIcon?: React.ReactNode; trailing?: React.ReactNode; label?: string; }

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({ className, leadingIcon, trailing, label, id: idProp, ...props }, ref) {
  const id = idProp ?? React.useId();
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block mb-1.5 text-2xs uppercase tracking-wider text-foreground-muted">{label}</label>}
      <div className="relative">
        {leadingIcon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none">{leadingIcon}</div>}
        <input ref={ref} id={id} className={cn("w-full h-12 rounded-xl px-4 text-base bg-base-raised border border-base-border text-foreground placeholder:text-foreground-subtle outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all", leadingIcon && "pl-11", trailing && "pr-12", className)} {...props} />
        {trailing && <div className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
    </div>
  );
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn("w-full rounded-xl px-4 py-3 text-base bg-base-raised border border-base-border text-foreground placeholder:text-foreground-subtle outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all resize-y", className)} {...props} />;
});
