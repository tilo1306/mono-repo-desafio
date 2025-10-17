import { Skeleton } from '@/components/ui/skeleton'

export function UsersSkeleton() {
  return (
    <div className="grid justify-items-center gap-16 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="pc-card-wrapper">
          <section className="pc-card">
            <div className="pc-inside">
              <div className="pc-shine" />
              <div className="pc-glare" />
              <div className="pc-content pc-avatar-content">
                {}
                <Skeleton className="avatar h-20 w-20 rounded-full" />

                {}
                <div className="pc-user-info">
                  <div className="pc-user-details">
                    {}
                    <div className="pc-mini-avatar">
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <div className="pc-user-text">
                      {}
                      <Skeleton className="mb-1 h-4 w-16" />
                      {}
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                  {}
                  <Skeleton className="pc-contact-btn h-8 w-full" />
                </div>
              </div>

              {}
              <div className="pc-content">
                <div className="pc-details">
                  {}
                  <Skeleton className="mb-2 h-6 w-24" />
                  {}
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          </section>
        </div>
      ))}
    </div>
  )
}
