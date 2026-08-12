import { Skeleton, SkeletonTaskRow } from "@/components/ui/skeleton";

export default function TasksLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-28 rounded-2xl" />
      </header>

      <div className="glass-ambient rounded-card p-5 space-y-4">
        <Skeleton className="h-4 w-28" />
        <SkeletonTaskRow />
        <SkeletonTaskRow />
        <SkeletonTaskRow />
        <SkeletonTaskRow />
        <SkeletonTaskRow />
      </div>

      <Skeleton className="h-4 w-24" />

      <div className="glass-ambient rounded-card p-5 space-y-4">
        <SkeletonTaskRow />
        <SkeletonTaskRow />
        <SkeletonTaskRow />
      </div>
    </div>
  );
}
