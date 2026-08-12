"use client";

import { PageError } from "@/components/page-error";

export default function GoalsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError error={error} reset={reset} backHref="/today" backLabel="Go to Today" />;
}
