import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shimmer-bg rounded-lg", className)} {...props} />;
}

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3.5", i === lines - 1 && lines > 1 ? "w-3/4" : "w-full")} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return <Skeleton className={cn("h-32 rounded-2xl", className)} />;
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-2xl bg-base-surface border border-base-border p-4 space-y-2.5">
      <Skeleton className="h-7 w-14" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function SkeletonTaskRow() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-base-surface border border-base-border">
      <Skeleton className="h-5 w-5 rounded-md shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

export function SkeletonMITRow() {
  return (
    <div className="flex items-start gap-3">
      <Skeleton className="w-7 h-7 rounded-full shrink-0 mt-1" />
      <div className="flex-1 space-y-2 p-3 rounded-xl bg-base-surface border border-base-border">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function SkeletonHabitRow() {
  return (
    <div className="flex items-center gap-3 p-2">
      <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
      <Skeleton className="h-4 w-28" />
      <div className="flex-1" />
      <Skeleton className="h-5 w-12 rounded-full" />
    </div>
  );
}

export function SkeletonNoteCard() {
  return (
    <div className="p-4 rounded-2xl bg-base-surface border border-base-border space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <SkeletonText lines={2} />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

export function SkeletonGoalCard() {
  return (
    <div className="p-4 rounded-2xl bg-base-surface border border-base-border space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function SkeletonJournalEntry() {
  return (
    <div className="p-4 rounded-2xl bg-base-surface border border-base-border space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonProjectCard() {
  return (
    <div className="p-4 rounded-2xl bg-base-surface border border-base-border flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}
