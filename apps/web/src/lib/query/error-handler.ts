import { refreshToken } from '@/services/auth/refresh-token'
import { useAuthStore } from '@/stores/token-store'
import type { Mutation, Query } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

export interface IErrorResponse {
  message: string
}

let isRedirecting = false
let isRefreshing = false
let failedQueue: Array<{
  query?: Query
  mutation?: Mutation<unknown, unknown, unknown, unknown>
  variables?: unknown
}> = []

const errorHandler = (
  error: unknown,
  query?: Query,
  mutation?: Mutation<unknown, unknown, unknown, unknown>,
  variables?: unknown,
): Promise<void> => {
  const { status, data } = (error as AxiosError<IErrorResponse>).response!

  if (status === 401) {
    const currentPath = window.location.pathname

    if (currentPath === '/login' || currentPath === '/cadastro') {
      return Promise.resolve()
    }

    if (mutation) return refreshTokenAndRetry(undefined, mutation, variables)
    else return refreshTokenAndRetry(query)
  } else {
    console.error(data?.message)
    return Promise.resolve()
  }
}

export const queryErrorHandler = (error: Error, query: Query) => {
  errorHandler(error, query)
}

export const mutationErrorHandler = (
  error: unknown,
  variables: unknown,
  _context: unknown,
  mutation: Mutation<unknown, unknown, unknown, unknown>,
) => {
  errorHandler(error, undefined, mutation, variables)
}

const processFailedQueue = () => {
  failedQueue.forEach(({ query, mutation, variables }) => {
    if (mutation) {
      mutation.execute(variables)
    }
    if (query) query.fetch()
  })
  isRefreshing = false
  failedQueue = []
}

const refreshTokenAndRetry = async (
  query?: Query,
  mutation?: Mutation<unknown, unknown, unknown, unknown>,
  variables?: unknown,
) => {
  try {
    if (!isRefreshing) {
      isRefreshing = true
      failedQueue.push({ query, mutation, variables })
      const { refreshToken: currentRefreshToken } = useAuthStore.getState()
      const { accessToken, refreshToken: newRefreshToken } = await refreshToken(
        {
          refreshToken: currentRefreshToken!,
        },
      )
      useAuthStore.getState().setTokens(accessToken, newRefreshToken)
      processFailedQueue()
    } else failedQueue.push({ query, mutation, variables })
  } catch {
    useAuthStore.getState().clearToken()
    if (!isRedirecting) {
      isRedirecting = true
      window.location.href = '/'
    }
  }
}
