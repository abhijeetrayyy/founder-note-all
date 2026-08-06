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
  const titleId = React.useId();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    return () => { document.body.style.overflow = prev; previousFocusRef.current?.focus(); };
  }, [open]);

  React.useEffect(() => {
    if (!open || !panelRef.current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open || !panelRef.current) return;
    const timer = setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
      );
      focusable?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [open]);

  if (!open) return null;

  const sizes: Record<string, string> = { sm: "sm:max-w-sm", md: "sm:max-w-md", lg: "sm:max-w-lg", full: "sm:max-w-3xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full glass-focused rounded-t-sheet sm:rounded-sheet shadow-focused max-h-[92vh] flex flex-col animate-slide-up",
          sizes[size],
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-base-border">
            <h2 id={titleId} className="text-lg font-bold text-foreground">{title}</h2>
            <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-base-raised flex items-center justify-center focus-ring transition-colors" aria-label="Close">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-foreground-muted"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-5 pb-[max(env(safe-area-inset-bottom),1rem)]">{children}</div>
      </div>
    </div>
  );
}
