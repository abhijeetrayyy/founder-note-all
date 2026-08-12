import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TaskNotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
      <Card className="p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-base-raised flex items-center justify-center">
          <svg className="w-8 h-8 text-foreground-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground font-display">Task not found</h2>
        <p className="text-sm text-foreground-muted">
          This task doesn&apos;t exist or was deleted.
        </p>
        <Link href="/loops" className="inline-block pt-2">
          <Button className="h-11 px-6">Go to Tasks</Button>
        </Link>
      </Card>
    </div>
  );
}
