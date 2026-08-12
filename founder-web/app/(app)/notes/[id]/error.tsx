"use client";

import { PageError } from "@/components/page-error";

export default function NoteDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError error={error} reset={reset} title="Could not load note" backHref="/notes" backLabel="Go to Notes" />;
}
