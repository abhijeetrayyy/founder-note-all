import { Skeleton, SkeletonTaskRow, SkeletonNoteCard } from "@/components/ui/skeleton";

export default function ProjectDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Skeleton className="h-4 w-32" />

      <div className="glass-ambient rounded-card p-6 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>

      <div className="glass-ambient rounded-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-28 rounded-2xl" />
        </div>
        <SkeletonTaskRow />
        <SkeletonTaskRow />
        <SkeletonTaskRow />
        <SkeletonTaskRow />
      </div>

      <div className="glass-ambient rounded-card p-5 space-y-4">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SkeletonNoteCard />
          <SkeletonNoteCard />
        </div>
      </div>
    </div>
  );
}
