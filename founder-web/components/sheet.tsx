"use client";

import { useEffect, useRef } from "react";
import { X } from "./icons";

/** Bottom sheet on a phone, centred dialog on a desk. Esc or a tap outside closes it. */
export function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
      }
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      before?.focus?.();
    };
  }, []);

  return (
    <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-40 flex items-end justify-center md:items-center md:p-6">
      <div className="absolute inset-0 animate-fade bg-black/35" onClick={onClose} />
      <div
        ref={panel}
        tabIndex={-1}
        className="relative max-h-[92dvh] w-full animate-sheet overflow-y-auto rounded-t-2xl bg-card pb-[env(safe-area-inset-bottom)] shadow-lift outline-none md:max-w-lg md:rounded-2xl"
      >
        <button type="button" onClick={onClose} aria-label="Close" className="icon-btn absolute right-3 top-3 z-10">
          <X />
        </button>
        {children}
      </div>
    </div>
  );
}
