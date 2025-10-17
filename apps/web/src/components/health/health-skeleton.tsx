import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function HealthSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>

              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
