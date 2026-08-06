import { Skeleton, SkeletonStatCard } from "@/components/ui/skeleton";

export default function StatsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-4 w-64" />
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      <div className="glass-ambient rounded-card p-5 space-y-4">
        <Skeleton className="h-4 w-40" />
        <div className="flex items-end gap-2 h-32">
          <Skeleton className="flex-1 rounded-t-lg" style={{ height: "40%" }} />
          <Skeleton className="flex-1 rounded-t-lg" style={{ height: "60%" }} />
          <Skeleton className="flex-1 rounded-t-lg" style={{ height: "80%" }} />
          <Skeleton className="flex-1 rounded-t-lg" style={{ height: "50%" }} />
          <Skeleton className="flex-1 rounded-t-lg" style={{ height: "90%" }} />
          <Skeleton className="flex-1 rounded-t-lg" style={{ height: "30%" }} />
          <Skeleton className="flex-1 rounded-t-lg" style={{ height: "70%" }} />
        </div>
      </div>
    </div>
  );
}
