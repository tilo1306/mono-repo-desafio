import { describe, expect, it, vi, beforeEach } from 'vitest'
import { getUsers } from '../../../services/auth/users'
import type { UsersResponse } from '../../../services/auth/users/type'

// Mock do axios
vi.mock('@/lib/util/axios', () => ({
  api: {
    get: vi.fn(),
  },
}))

describe('Users Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should get users without parameters', async () => {
    const mockUsersData: UsersResponse = {
      users: [
        {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar: 'https://example.com/avatar1.jpg',
        },
        {
          id: 'user-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          avatar: 'https://example.com/avatar2.jpg',
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
    }

    const { api } = await import('@/lib/util/axios')
    vi.mocked(api.get).mockResolvedValue({
      data: mockUsersData,
    })

    const result = await getUsers()

    expect(api.get).toHaveBeenCalledWith('/auth/users?')
    expect(result).toEqual(mockUsersData)
  })

  it('should get users with pagination parameters', async () => {
    const mockUsersData: UsersResponse = {
      users: [],
      total: 0,
      page: 2,
      limit: 5,
    }

    const { api } = await import('@/lib/util/axios')
    vi.mocked(api.get).mockResolvedValue({
      data: mockUsersData,
    })

    const result = await getUsers({ page: 2, limit: 5 })

    expect(api.get).toHaveBeenCalledWith('/auth/users?page=2&limit=5')
    expect(result).toEqual(mockUsersData)
  })

  it('should get users with email filter', async () => {
    const mockUsersData: UsersResponse = {
      users: [
        {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar: 'https://example.com/avatar1.jpg',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    }

    const { api } = await import('@/lib/util/axios')
    vi.mocked(api.get).mockResolvedValue({
      data: mockUsersData,
    })

    const result = await getUsers({ email: 'john@example.com' })

    expect(api.get).toHaveBeenCalledWith('/auth/users?email=john%40example.com')
    expect(result).toEqual(mockUsersData)
  })

  it('should get users with all parameters', async () => {
    const mockUsersData: UsersResponse = {
      users: [],
      total: 0,
      page: 3,
      limit: 20,
    }

    const { api } = await import('@/lib/util/axios')
    vi.mocked(api.get).mockResolvedValue({
      data: mockUsersData,
    })

    const result = await getUsers({ 
      page: 3, 
      limit: 20, 
      email: 'test@example.com' 
    })

    expect(api.get).toHaveBeenCalledWith('/auth/users?page=3&limit=20&email=test%40example.com')
    expect(result).toEqual(mockUsersData)
  })

  it('should handle users fetch error', async () => {
    const mockError = new Error('Users not found')
    
    const { api } = await import('@/lib/util/axios')
    vi.mocked(api.get).mockRejectedValue(mockError)

    await expect(getUsers()).rejects.toThrow('Users not found')
  })
})

