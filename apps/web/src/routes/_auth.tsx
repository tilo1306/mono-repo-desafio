import { useAuthStore } from '@/stores/token-store'
import {
  createFileRoute,
  Outlet,
  redirect,
  useLocation,
  useNavigate,
} from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/_auth')({
  component: RouteComponent,
  beforeLoad: async () => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken) {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
})

function RouteComponent() {
  const navigate = useNavigate()
  const location = useLocation()
  const { accessToken } = useAuthStore()

  useEffect(() => {
    
    if (
      useAuthStore.persist.hasHydrated() &&
      accessToken &&
      location.pathname === '/login'
    ) {
      navigate({ to: '/dashboard', replace: true })
    }
  }, [accessToken, navigate, location.pathname])

  return (
    <div className="bg-background text-foreground min-h-screen max-w-screen">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
