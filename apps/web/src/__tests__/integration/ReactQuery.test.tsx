import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { Router } from '@tanstack/react-router'
import { type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '../test-utils'

// Mock do serviço de health
vi.mock('../../services/health', () => ({
  getHealth: vi.fn(),
}))

// Componente de teste que usa React Query
function TestComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { getHealth } = await import('../../services/health')
      return getHealth()
    },
  })

  if (isLoading) return <div>Carregando...</div>
  if (error) return <div>Erro: {(error as Error).message}</div>
  if (!data) return <div>Nenhum dado</div>

  return <div>Status: {data.status}</div>
}

// Wrapper para testes de integração
function IntegrationTestWrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <Router>{children}</Router>
    </QueryClientProvider>
  )
}

describe('Integration Test - React Query', () => {
  it('should load data successfully', async () => {
    const mockHealthData = { status: 'ok', timestamp: '2024-01-01T00:00:00Z' }

    const { getHealth } = await import('../../services/health')
    vi.mocked(getHealth).mockResolvedValue(mockHealthData)

    render(
      <IntegrationTestWrapper>
        <TestComponent />
      </IntegrationTestWrapper>,
    )

    expect(screen.getByText('Carregando...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Status: ok')).toBeInTheDocument()
    })

    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument()
  })

  it('should handle loading error', async () => {
    const { getHealth } = await import('../../services/health')
    vi.mocked(getHealth).mockRejectedValue(new Error('Service unavailable'))

    render(
      <IntegrationTestWrapper>
        <TestComponent />
      </IntegrationTestWrapper>,
    )

    await waitFor(() => {
      expect(screen.getByText('Erro: Service unavailable')).toBeInTheDocument()
    })
  })
})
