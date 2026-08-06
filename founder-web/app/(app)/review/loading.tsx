import { Skeleton, SkeletonStatCard, SkeletonText } from "@/components/ui/skeleton";

export default function ReviewLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72" />
      </header>

      <div className="grid grid-cols-2 gap-3">
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      <div className="glass-ambient rounded-card p-5 space-y-4">
        <Skeleton className="h-4 w-36" />
        <div className="space-y-3">
          <div className="flex gap-3">
            <Skeleton className="w-6 h-6 rounded-full shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="w-6 h-6 rounded-full shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="w-6 h-6 rounded-full shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="w-6 h-6 rounded-full shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
        </div>
      </div>

      <div className="glass-ambient rounded-card p-5 space-y-4">
        <Skeleton className="h-4 w-36" />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </div>

      <div className="glass-ambient rounded-card p-5 space-y-4">
        <Skeleton className="h-4 w-36" />
        <SkeletonText lines={2} />
        <SkeletonText lines={2} />
        <SkeletonText lines={2} />
      </div>

      <div className="flex gap-3">
        <Skeleton className="h-12 flex-1 rounded-2xl" />
        <Skeleton className="h-12 flex-1 rounded-2xl" />
      </div>
    </div>
  );
}
