"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
}

export function Sheet({ open, onClose, title, children, className, size = "md" }: SheetProps) {
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    full: "sm:max-w-3xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full bg-surface dark:bg-dark-surface rounded-t-sheet sm:rounded-sheet border border-border dark:border-dark-border shadow-2xl max-h-[92vh] flex flex-col animate-slide-up",
          sizes[size],
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-dark-border">
            <h2 className="text-lg font-bold">{title}</h2>
            <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-surface-alt dark:hover:bg-dark-surface-alt flex items-center justify-center focus-ring" aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-5 pb-[max(env(safe-area-inset-bottom),1rem)]">{children}</div>
      </div>
    </div>
  );
}
