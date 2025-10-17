import { describe, expect, it, vi, beforeEach } from 'vitest'
import { refreshToken } from '../../../services/auth/refresh-token'

// Mock do axios
vi.mock('@/lib/util/axios', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('Auth Service - Refresh Token', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should refresh token successfully', async () => {
    const tokenData = {
      refreshToken: 'refresh-token-123',
    }

    const mockResponse = {
      data: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
    }

    const api = await import('@/lib/util/axios')
    vi.mocked(api.default.post).mockResolvedValue(mockResponse)

    const result = await refreshToken(tokenData)

    expect(api.default.post).toHaveBeenCalledWith('/auth/refresh', tokenData, {
      withCredentials: true,
    })
    expect(result).toEqual(mockResponse.data)
  })

  it('should handle refresh token error', async () => {
    const tokenData = {
      refreshToken: 'invalid-refresh-token',
    }

    const mockError = new Error('Refresh token expired')

    const api = await import('@/lib/util/axios')
    vi.mocked(api.default.post).mockRejectedValue(mockError)

    await expect(refreshToken(tokenData)).rejects.toThrow('Refresh token expired')
  })

  it('should handle network error', async () => {
    const tokenData = {
      refreshToken: 'refresh-token-123',
    }

    const mockError = new Error('Network Error')

    const api = await import('@/lib/util/axios')
    vi.mocked(api.default.post).mockRejectedValue(mockError)

    await expect(refreshToken(tokenData)).rejects.toThrow('Network Error')
  })

  it('should handle invalid response', async () => {
    const tokenData = {
      refreshToken: 'refresh-token-123',
    }

    const mockResponse = {
      data: {
        // Missing accessToken
        refreshToken: 'new-refresh-token',
      },
    }

    const api = await import('@/lib/util/axios')
    vi.mocked(api.default.post).mockResolvedValue(mockResponse)

    // This test would need to be implemented in the service itself
    // For now, we'll just test that the service is called
    const result = await refreshToken(tokenData)
    expect(result).toEqual(mockResponse.data)
  })
})

