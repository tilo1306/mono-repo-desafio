import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useRouterState } from '@tanstack/react-router'
import React from 'react'
import { NotificationsDropdown } from './notifications-dropdown'

export function SiteHeader() {
  const location = useRouterState({ select: s => s.location })
  const segments = location.pathname.split('/').filter(Boolean)
  const crumbs = segments.map((seg, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/')
    const label = seg.replace(/[-_]/g, ' ')
    return { href, label: label.charAt(0).toUpperCase() + label.slice(1) }
  })

  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex shrink-0 items-center gap-2 border-b backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full flex-nowrap items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-10"
          />
          <div className="hidden min-w-0 flex-1 sm:block">
            <Breadcrumb>
              <BreadcrumbList className="flex-nowrap truncate whitespace-nowrap">
                {crumbs.slice(0, -1).map(c => (
                  <React.Fragment key={c.href}>
                    <BreadcrumbItem>
                      <BreadcrumbLink href={c.href}>{c.label}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </React.Fragment>
                ))}
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {crumbs.length ? crumbs[crumbs.length - 1].label : 'Home'}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        <NotificationsDropdown />
      </div>
    </header>
  )
}
