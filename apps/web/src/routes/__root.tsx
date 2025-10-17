import Header from '@/components/Header'
import { Toaster } from '@/components/ui/sonner'
import type { AuthState } from '@/context/auth'
import { ReactQueryProvider } from '@/providers/react-query-provider'
import {
  createRootRouteWithContext,
  Outlet,
  useRouterState,
} from '@tanstack/react-router'

interface MyRouterContext {
  auth: AuthState
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => {
    const location = useRouterState({ select: s => s.location })
    const pathname = location.pathname

    const showHeader =
      !pathname.startsWith('/_auth') &&
      !pathname.startsWith('/dashboard') &&
      !pathname.startsWith('/_app')

    return (
      <ReactQueryProvider>
        <div className="bg-background text-foreground min-h-screen max-w-screen overflow-x-hidden">
          {showHeader && <Header key={pathname} />}
          <main className="flex-1">
            <Toaster richColors position="top-center" />
            <Outlet />
          </main>
        </div>
      </ReactQueryProvider>
    )
  },
})
