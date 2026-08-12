import { Skeleton, SkeletonTaskRow } from "@/components/ui/skeleton";

export default function InboxLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-4 w-72" />
      </header>

      <div className="glass-ambient rounded-card p-5 space-y-4">
        <Skeleton className="h-4 w-28" />
        <SkeletonTaskRow />
        <SkeletonTaskRow />
        <SkeletonTaskRow />
        <SkeletonTaskRow />
        <SkeletonTaskRow />
      </div>
    </div>
  );
}
