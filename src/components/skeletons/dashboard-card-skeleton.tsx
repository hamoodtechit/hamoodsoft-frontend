import { Skeleton } from "@/components/ui/skeleton"

export function DashboardCardSkeleton() {
  return (
    <div className="group relative flex flex-col items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border-2 border-transparent px-1.5 py-2 sm:px-2 sm:py-3 md:px-3 md:py-4 bg-muted/50 animate-pulse">
      <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full" />
      <Skeleton className="h-4 w-16 sm:w-20 md:w-24" />
    </div>
  )
}

export function DashboardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-2 sm:gap-2.5 md:gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <DashboardCardSkeleton key={i} />
      ))}
    </div>
  )
}
