import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getTasksPaginated } from '@/services/task'
import { useAuthStore } from '@/stores/token-store'
import { useQueryClient } from '@tanstack/react-query'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AppSidebar } from './-components/app-sidebar'
import { SiteHeader } from './-components/site-header'

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardLayout,
  notFoundComponent: () => (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Página não encontrada</h1>
        <p className="text-muted-foreground mt-2">
          A página que você está procurando não existe.
        </p>
      </div>
    </div>
  ),
  beforeLoad: async () => {
    const { accessToken } = useAuthStore.getState()
    if (!accessToken) {
      throw redirect({ to: '/' })
    }
  },
})

function DashboardLayout() {
  const queryClient = useQueryClient()
  queryClient.prefetchQuery({
    queryKey: ['tasks'],
    queryFn: () => getTasksPaginated(),
  })
  queryClient.prefetchQuery({
    queryKey: ['task', 100],
    queryFn: () =>
      getTasksPaginated({
        size: 100,
      }),
  })

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative min-w-0 md:ml-0 md:peer-data-[state=collapsed]:w-[calc(100vw-var(--sidebar-width-icon))] md:peer-data-[state=expanded]:w-[calc(100vw-var(--sidebar-width))]">
        <SiteHeader />
        <div className="mx-auto flex h-[calc(100vh-var(--header-height))] w-full min-w-0 flex-col p-4 sm:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
