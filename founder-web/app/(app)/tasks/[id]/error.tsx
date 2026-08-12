"use client";

import { PageError } from "@/components/page-error";

export default function TaskDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError error={error} reset={reset} title="Could not load task" backHref="/tasks" backLabel="Go to Tasks" />;
}
