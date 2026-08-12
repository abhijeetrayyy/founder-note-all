"use client";

import { PageError } from "@/components/page-error";

export default function FocusError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError error={error} reset={reset} title="Could not load focus timer" backHref="/today" backLabel="Go to Today" />;
}
