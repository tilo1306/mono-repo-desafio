import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'

// Função para criar um QueryClient para testes
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

// Wrapper customizado para testes
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

// Função customizada de render que inclui todos os providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-exporta tudo
export * from '@testing-library/react'
export { customRender as render }
