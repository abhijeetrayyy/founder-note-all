import { Skeleton, SkeletonMITRow, SkeletonHabitRow, SkeletonGoalCard, SkeletonNoteCard } from "@/components/ui/skeleton";

export default function TodayLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <header className="space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-9 w-72" />
      </header>

      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-28 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="space-y-2">
          <SkeletonMITRow />
          <SkeletonMITRow />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <Skeleton className="h-3 w-16" />
          <SkeletonHabitRow />
          <SkeletonHabitRow />
          <SkeletonHabitRow />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-3 w-20" />
          <SkeletonGoalCard />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-3 w-20" />
          <SkeletonNoteCard />
        </div>
      </div>
    </div>
  );
}
