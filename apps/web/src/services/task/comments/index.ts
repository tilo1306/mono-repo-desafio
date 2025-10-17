import { api } from '@/lib/util/axios'
import type { PaginationDto } from '../type'

export interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    name: string
    avatar: string
    email: string
  }
}

export interface CreateCommentPayload {
  content: string
}

export interface CommentsResponse {
  data: Comment[]
  total: number
  page: number
  size: number
  totalPages: number
}

export const getTaskComments = async (
  taskId: string,
  pagination: PaginationDto = { page: 1, size: 10 },
): Promise<CommentsResponse> => {
  const response = await api.get(`/tasks/${taskId}/comments`, {
    params: pagination,
  })
  return response.data
}

export const createTaskComment = async (
  taskId: string,
  payload: CreateCommentPayload,
): Promise<Comment> => {
  const response = await api.post(`/tasks/${taskId}/comments`, payload)
  return response.data
}
