import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-64" />
      </header>

      <div className="glass-ambient rounded-card p-5 space-y-4">
        <Skeleton className="h-4 w-20" />
        <div className="space-y-4">
          <div>
            <Skeleton className="h-3 w-28 mb-2" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
          <div>
            <Skeleton className="h-3 w-28 mb-2" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-11 w-32 rounded-2xl" />
        </div>
      </div>

      <div className="glass-ambient rounded-card p-5 space-y-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-80" />
      </div>
    </div>
  );
}
