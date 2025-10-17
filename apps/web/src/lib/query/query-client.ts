import { MutationCache, QueryCache } from '@tanstack/react-query'
import { mutationErrorHandler, queryErrorHandler } from './error-handler'

export const queryClientConfig = {
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: true,
      suspense: false,
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
  queryCache: new QueryCache({
    onError: queryErrorHandler as any,
  }),
  mutationCache: new MutationCache({
    onError: mutationErrorHandler,
  }),
}
