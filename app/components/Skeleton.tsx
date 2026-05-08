export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-mist ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="border border-smoke bg-paper p-5 flex flex-col gap-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function RowSkeleton() {
  return (
    <div className="border border-smoke bg-paper px-5 py-3 flex items-center justify-between">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-5 w-12" />
    </div>
  )
}

export function ScheduleSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="pb-1 border-b border-smoke mb-2">
            <Skeleton className="h-3 w-8 mb-1" />
            <Skeleton className="h-3 w-12" />
          </div>
          {i % 2 === 0 && <CardSkeleton />}
        </div>
      ))}
    </div>
  )
}
