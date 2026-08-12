import { Skeleton, SkeletonTaskRow } from "@/components/ui/skeleton";

export default function PlanLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72" />
      </header>

      <div className="glass-ambient rounded-card p-5 space-y-4">
        <Skeleton className="h-4 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-2xl" />
          <Skeleton className="h-10 flex-1 rounded-2xl" />
          <Skeleton className="h-10 flex-1 rounded-2xl" />
        </div>
      </div>

      <div className="glass-ambient rounded-card p-5 space-y-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-4 w-16" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>

      <div className="glass-ambient rounded-card p-5 space-y-4">
        <Skeleton className="h-4 w-48" />
        <SkeletonTaskRow />
        <SkeletonTaskRow />
        <SkeletonTaskRow />
        <SkeletonTaskRow />
        <SkeletonTaskRow />
      </div>
    </div>
  );
}
