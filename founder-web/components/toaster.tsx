"use client";

import { dismiss, useToast } from "@/lib/toast";

export function Toaster() {
  const t = useToast();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 md:bottom-6"
    >
      {t && (
        <div
          key={t.id}
          className="pointer-events-auto flex max-w-md animate-rise items-center gap-3 rounded-xl bg-ink py-2.5 pl-4 pr-2 text-[14px] text-card shadow-lift"
        >
          <span className="min-w-0 flex-1">{t.text}</span>
          {t.action ? (
            <button
              type="button"
              onClick={() => {
                t.action?.run();
                dismiss();
              }}
              className="shrink-0 rounded-lg px-3 py-1.5 font-medium text-card underline-offset-2 hover:bg-card/10"
            >
              {t.action.label}
            </button>
          ) : (
            <span className="w-2" />
          )}
        </div>
      )}
    </div>
  );
}
