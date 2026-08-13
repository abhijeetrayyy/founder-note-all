"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

/** An optional recovery affordance carried by the toast itself. */
export interface ToastAction {
  label: string;
  onClick: () => void | Promise<void>;
}

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
  timer?: ReturnType<typeof setTimeout>;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, action?: ToastAction) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const timersRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const show = React.useCallback((message: string, type: ToastType = "info", action?: ToastAction) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type, action }]);
    // An undo the founder cannot reach in time is not an undo. Anything
    // carrying an action gets long enough to actually notice and click it.
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, action ? 8000 : 3000);
    timersRef.current.set(id, timer);
  }, []);

  function dismiss(id: string) {
    const timer = timersRef.current.get(id);
    if (timer) clearTimeout(timer);
    timersRef.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function pauseTimer(id: string) {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }

  function resumeTimer(id: string) {
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, 3000);
    timersRef.current.set(id, timer);
  }

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div role="alert" aria-live="polite" className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none safe-bottom">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            onMouseEnter={() => pauseTimer(t.id)}
            onMouseLeave={() => resumeTimer(t.id)}
            className="pointer-events-auto min-w-[240px] max-w-sm px-4 py-3 rounded-2xl glass-focused shadow-focused text-sm font-semibold text-foreground flex items-center gap-2.5 animate-slide-up"
          >
            <span
              className={cn( "w-2 h-2 rounded-full shrink-0",
                t.type === "success" && "bg-state-done",
                t.type === "error" && "bg-state-overdue",
                t.type === "info" && "bg-accent",
              )}
            />
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                onClick={async () => { dismiss(t.id); await t.action!.onClick(); }}
                className="flex-none text-accent font-bold hover:underline underline-offset-2 focus-ring rounded px-1"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
