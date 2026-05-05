import { Skeleton } from './skeleton'

export function MatchCardSkeleton() {
  return (
    <div className="bg-card-bg rounded-xl p-4 border border-border">
      {/* Время и избранное */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Лига */}
      <Skeleton className="h-4 w-32 mb-4" />

      {/* Команды */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-8 ml-auto" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-6 w-8 ml-auto" />
        </div>
      </div>

      {/* Коэффициенты */}
      <div className="flex gap-2">
        <Skeleton className="h-14 flex-1 rounded-lg" />
        <Skeleton className="h-14 flex-1 rounded-lg" />
        <Skeleton className="h-14 flex-1 rounded-lg" />
      </div>
    </div>
  )
}

export function MatchCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  )
}
