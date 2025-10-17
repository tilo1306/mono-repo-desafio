import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LoginFormData } from '../../../schemas/login'
import { login } from '../../../services/auth/login'

// Mock do axios
vi.mock('@/lib/util/axios', () => ({
  api: {
    post: vi.fn(),
  },
}))

describe('Auth Service - Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should login successfully', async () => {
    const mockResponse = {
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    }

    const { api } = await import('@/lib/util/axios')
    vi.mocked(api.post).mockResolvedValue(mockResponse)

    const loginData: LoginFormData = {
      email: 'test@example.com',
      password: 'password123',
    }

    const result = await login(loginData)

    expect(api.post).toHaveBeenCalledWith('/auth/login', loginData, {
      withCredentials: false,
    })
    expect(result).toEqual({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    })
  })

  it('should handle login error', async () => {
    const mockError = new Error('Invalid credentials')

    const { api } = await import('@/lib/util/axios')
    vi.mocked(api.post).mockRejectedValue(mockError)

    const loginData: LoginFormData = {
      email: 'wrong@example.com',
      password: 'wrongpassword',
    }

    await expect(login(loginData)).rejects.toThrow('Invalid credentials')
    expect(api.post).toHaveBeenCalledWith('/auth/login', loginData, {
      withCredentials: false,
    })
  })

  it('should validate input data', async () => {
    const mockResponse = {
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    }

    const { api } = await import('@/lib/util/axios')
    vi.mocked(api.post).mockResolvedValue(mockResponse)

    const loginData: LoginFormData = {
      email: 'test@example.com',
      password: 'password123',
    }

    await login(loginData)

    expect(api.post).toHaveBeenCalledWith(
      '/auth/login',
      expect.objectContaining({
        email: 'test@example.com',
        password: 'password123',
      }),
      expect.objectContaining({
        withCredentials: false,
      }),
    )
  })
})
