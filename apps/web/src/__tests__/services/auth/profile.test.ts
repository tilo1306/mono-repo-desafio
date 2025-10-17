import { describe, expect, it, vi, beforeEach } from 'vitest'
import { getUserProfile } from '../../../services/auth/profile'
import type { ProfileResponse } from '../../../services/auth/profile/type'

// Mock do axios
vi.mock('@/lib/util/axios', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('Profile Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should get user profile successfully', async () => {
    const mockProfileData: ProfileResponse = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://example.com/avatar.jpg',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    const api = await import('@/lib/util/axios')
    vi.mocked(api.default.get).mockResolvedValue({
      data: mockProfileData,
    })

    const result = await getUserProfile()

    expect(api.default.get).toHaveBeenCalledWith('/auth/profile')
    expect(result).toEqual(mockProfileData)
  })

  it('should handle profile fetch error', async () => {
    const mockError = new Error('Profile not found')
    
    const api = await import('@/lib/util/axios')
    vi.mocked(api.default.get).mockRejectedValue(mockError)

    await expect(getUserProfile()).rejects.toThrow('Profile not found')
  })

  it('should handle network error', async () => {
    const mockError = new Error('Network Error')
    
    const api = await import('@/lib/util/axios')
    vi.mocked(api.default.get).mockRejectedValue(mockError)

    await expect(getUserProfile()).rejects.toThrow('Network Error')
  })
})

