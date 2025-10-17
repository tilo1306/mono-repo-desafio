import { describe, expect, it, vi, beforeEach } from 'vitest'
import { getTaskComments, createTaskComment } from '../../../services/task/comments'

// Mock do axios
vi.mock('@/lib/util/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('Task Comments Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTaskComments', () => {
    it('should get task comments successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            { id: '1', content: 'First comment', user: { name: 'User 1', avatar: '', email: 'user1@example.com' }, createdAt: '2024-01-01T00:00:00Z' },
            { id: '2', content: 'Second comment', user: { name: 'User 2', avatar: '', email: 'user2@example.com' }, createdAt: '2024-01-01T01:00:00Z' },
          ],
          total: 2,
          page: 1,
          size: 10,
          totalPages: 1,
        },
      }

      const { api } = await import('@/lib/util/axios')
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await getTaskComments('task-123')

      expect(api.get).toHaveBeenCalledWith('/tasks/task-123/comments', {
        params: { page: 1, size: 10 },
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should get task comments with pagination', async () => {
      const mockResponse = {
        data: {
          data: [{ id: '1', content: 'Comment', user: { name: 'User', avatar: '', email: 'user@example.com' }, createdAt: '2024-01-01T00:00:00Z' }],
          total: 15,
          page: 1,
          size: 10,
          totalPages: 2,
        },
      }

      const { api } = await import('@/lib/util/axios')
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await getTaskComments('task-123', { page: 1, size: 10 })

      expect(api.get).toHaveBeenCalledWith('/tasks/task-123/comments', {
        params: { page: 1, size: 10 },
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle get comments error', async () => {
      const mockError = new Error('Failed to fetch comments')

      const { api } = await import('@/lib/util/axios')
      vi.mocked(api.get).mockRejectedValue(mockError)

      await expect(getTaskComments('task-123')).rejects.toThrow('Failed to fetch comments')
    })
  })

  describe('createTaskComment', () => {
    it('should create task comment successfully', async () => {
      const commentData = {
        content: 'New comment',
      }

      const mockResponse = {
        data: {
          id: 'comment-123',
          content: 'New comment',
          user: { name: 'Current User', avatar: '', email: 'current@example.com' },
          createdAt: '2024-01-01T00:00:00Z',
        },
      }

      const { api } = await import('@/lib/util/axios')
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await createTaskComment('task-123', commentData)

      expect(api.post).toHaveBeenCalledWith('/tasks/task-123/comments', commentData)
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle create comment error', async () => {
      const commentData = {
        content: '',
      }

      const mockError = new Error('Comment content is required')

      const { api } = await import('@/lib/util/axios')
      vi.mocked(api.post).mockRejectedValue(mockError)

      await expect(createTaskComment('task-123', commentData)).rejects.toThrow('Comment content is required')
    })
  })
})
