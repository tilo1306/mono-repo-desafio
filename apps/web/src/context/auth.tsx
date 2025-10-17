import { useAuthStore } from '@/stores/token-store'
import React, { createContext, useContext, useEffect, useState } from 'react'

interface AuthState {
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const checkHydration = () => {
      if (useAuthStore.persist.hasHydrated()) {
        const token = useAuthStore.getState().accessToken
        setIsAuthenticated(!!token)
        setIsHydrated(true)
      } else {
        setTimeout(checkHydration, 50)
      }
    }

    checkHydration()

    const unsubscribe = useAuthStore.subscribe(state => {
      setIsAuthenticated(!!state.accessToken)
    })

    return unsubscribe
  }, [])

  if (!isHydrated) {
    return null
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export type { AuthState }
