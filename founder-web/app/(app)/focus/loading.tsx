import { Skeleton } from "@/components/ui/skeleton";

export default function FocusLoading() {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-64" />
      </header>

      <div className="glass-ambient rounded-card p-8 flex flex-col items-center text-center space-y-6">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-pill" />
          <Skeleton className="h-10 w-24 rounded-pill" />
          <Skeleton className="h-10 w-24 rounded-pill" />
        </div>

        <div className="relative w-64 h-64">
          <Skeleton className="w-full h-full rounded-full" />
        </div>

        <div className="flex gap-3 mt-8">
          <Skeleton className="h-12 w-32 rounded-2xl" />
          <Skeleton className="h-12 w-24 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
