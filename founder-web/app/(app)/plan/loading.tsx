import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the board: the commitment strip, then the four lanes. */
export default function PlanLoading() {
  return (
    <div className="max-w-[1180px] mx-auto px-5 sm:px-7 pt-7 pb-16 space-y-5">
      <div className="rounded-[8px] bg-[#1B1B1F] p-6 space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-12 w-full rounded-[6px]" />
        <Skeleton className="h-12 w-full rounded-[6px]" />
        <Skeleton className="h-12 w-full rounded-[6px]" />
        <Skeleton className="h-11 w-full rounded-[6px] mt-4" />
      </div>

      <Skeleton className="h-11 w-full rounded-[6px]" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-[8px] border border-[#26262B] bg-[#141417] p-5 space-y-3">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-10 w-full rounded-[6px]" />
            <Skeleton className="h-10 w-full rounded-[6px]" />
            <Skeleton className="h-10 w-full rounded-[6px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
