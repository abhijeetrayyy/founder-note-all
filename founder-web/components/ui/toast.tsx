"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  timer?: ReturnType<typeof setTimeout>;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const timersRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const show = React.useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, 3000);
    timersRef.current.set(id, timer);
  }, []);

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
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                t.type === "success" && "bg-state-done",
                t.type === "error" && "bg-state-overdue",
                t.type === "info" && "bg-accent",
              )}
            />
            {t.message}
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
