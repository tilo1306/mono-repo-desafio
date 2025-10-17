import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RegisterFormData } from '../../../schemas/register'
import { register } from '../../../services/auth/register'

// Mock do axios
vi.mock('@/lib/util/axios', () => ({
  api: {
    post: vi.fn(),
  },
}))

describe('Auth Service - Register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should register user successfully', async () => {
    const mockResponse = {
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    }

    const { api } = await import('@/lib/util/axios')
    vi.mocked(api.post).mockResolvedValue(mockResponse)

    const registerData: RegisterFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    }

    const result = await register(registerData)

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    })
    expect(result).toEqual(mockResponse.data)
  })

  it('should handle registration error', async () => {
    const mockError = new Error('Email already exists')

    const { api } = await import('@/lib/util/axios')
    vi.mocked(api.post).mockRejectedValue(mockError)

    const registerData: RegisterFormData = {
      name: 'John Doe',
      email: 'existing@example.com',
      password: 'password123',
    }

    await expect(register(registerData)).rejects.toThrow('Email already exists')
    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'John Doe',
      email: 'existing@example.com',
      password: 'password123',
    })
  })

  it('should validate input data', async () => {
    const { api } = await import('@/lib/util/axios')

    const registerData: RegisterFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    }

    const mockResponse = {
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    }

    vi.mocked(api.post).mockResolvedValue(mockResponse)

    await register(registerData)

    expect(api.post).toHaveBeenCalledWith(
      '/auth/register',
      expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      }),
    )
  })

  it('should handle network errors', async () => {
    const { api } = await import('@/lib/util/axios')
    vi.mocked(api.post).mockRejectedValue(new Error('Network error'))

    const registerData: RegisterFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    }

    await expect(register(registerData)).rejects.toThrow('Network error')
  })
})
