import { HealthContent } from '@/components/health/health-content'
import { HealthProvider } from '@/components/health/health-context'
import { HealthHeader } from '@/components/health/health-header'
import { HealthSkeleton } from '@/components/health/health-skeleton'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'

export const Route = createFileRoute('/_app/dashboard/health/')({
  component: HealthPage,
})

function HealthPage() {
  return (
    <HealthProvider>
      <section>
        <div className="bg-background p-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <HealthHeader />
            <Suspense fallback={<HealthSkeleton />}>
              <HealthContent />
            </Suspense>
          </div>
        </div>
      </section>
    </HealthProvider>
  )
}
