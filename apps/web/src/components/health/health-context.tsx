import { createContext, type ReactNode, useContext, useState } from 'react'

interface HealthContextType {
  lastUpdated: Date | null
  setLastUpdated: (date: Date) => void
}

const HealthContext = createContext<HealthContextType | undefined>(undefined)

export function HealthProvider({ children }: { children: ReactNode }) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  return (
    <HealthContext.Provider value={{ lastUpdated, setLastUpdated }}>
      {children}
    </HealthContext.Provider>
  )
}

export function useHealthContext() {
  const context = useContext(HealthContext)
  if (context === undefined) {
    throw new Error('useHealthContext must be used within a HealthProvider')
  }
  return context
}
