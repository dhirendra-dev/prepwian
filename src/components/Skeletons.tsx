import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function ListRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="h-3.5 w-12" />
        </li>
      ))}
    </ul>
  );
}

export function MaterialCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-5/6" />
      <div className="mt-3 flex gap-1.5">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-4 w-20 rounded" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function MaterialsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <MaterialCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FeedPostSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-3/4" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-6 w-14 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-14 rounded-md" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <FeedPostSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-soft sm:p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="mt-2 h-6 w-20" />
      <Skeleton className="mt-1.5 h-2.5 w-14" />
    </div>
  );
}
