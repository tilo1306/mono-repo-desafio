import { queryClientConfig } from '@/lib/query/query-client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import * as React from 'react'

export function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = React.useState(() => new QueryClient(queryClientConfig))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
