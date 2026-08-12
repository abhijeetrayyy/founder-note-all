"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PageError({
  error,
  reset,
  title = "Something went wrong",
  backHref = "/today",
  backLabel = "Go to Today",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
      <Card className="p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-state-overdue-surface flex items-center justify-center">
          <svg className="w-8 h-8 text-state-overdue" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 className="text-xl font-extrabold text-foreground">{title}</h2>
        <p className="text-sm text-foreground-muted max-w-sm mx-auto">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button onClick={reset} className="h-11 px-6">
            Try again
          </Button>
          <a href={backHref} className="text-sm font-bold text-foreground-muted hover:text-accent">
            {backLabel}
          </a>
        </div>
      </Card>
    </div>
  );
}
