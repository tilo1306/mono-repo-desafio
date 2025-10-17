import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '../../stores/token-store'

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear store state before each test
    useAuthStore.getState().clearToken()
  })

  it('should initialize with null tokens', () => {
    const state = useAuthStore.getState()

    expect(state.accessToken).toBeNull()
    expect(state.refreshToken).toBeNull()
  })

  it('should set tokens correctly', () => {
    const accessToken = 'access-token-123'
    const refreshToken = 'refresh-token-456'

    useAuthStore.getState().setTokens(accessToken, refreshToken)

    const state = useAuthStore.getState()
    expect(state.accessToken).toBe(accessToken)
    expect(state.refreshToken).toBe(refreshToken)
  })

  it('should clear tokens correctly', () => {
    // First set tokens
    useAuthStore.getState().setTokens('access-token', 'refresh-token')

    // Then clear them
    useAuthStore.getState().clearToken()

    const state = useAuthStore.getState()
    expect(state.accessToken).toBeNull()
    expect(state.refreshToken).toBeNull()
  })

  it('should update tokens when setTokens is called multiple times', () => {
    const firstAccessToken = 'first-access-token'
    const firstRefreshToken = 'first-refresh-token'
    const secondAccessToken = 'second-access-token'
    const secondRefreshToken = 'second-refresh-token'

    // Set first tokens
    useAuthStore.getState().setTokens(firstAccessToken, firstRefreshToken)

    let state = useAuthStore.getState()
    expect(state.accessToken).toBe(firstAccessToken)
    expect(state.refreshToken).toBe(firstRefreshToken)

    // Set second tokens
    useAuthStore.getState().setTokens(secondAccessToken, secondRefreshToken)

    state = useAuthStore.getState()
    expect(state.accessToken).toBe(secondAccessToken)
    expect(state.refreshToken).toBe(secondRefreshToken)
  })
})
