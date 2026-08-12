"use client";

import { PageError } from "@/components/page-error";

export default function ProjectDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError error={error} reset={reset} title="Could not load project" backHref="/projects" backLabel="Go to Projects" />;
}
