import type { Priority, Status } from '@/utils/enums'

export interface Task {
  id: string
  title: string
  description?: string
  status: Status
  priority: Priority
  deadline?: string
  createdAt: string
  updatedAt: string
  creator: {
    name: string
    email: string
  }
  assignees: Array<{
    id: string
    userId: string
    user: {
      name: string
      email: string
      avatar: string
    }
  }>
}

export interface CreateTaskPayload {
  title: string
  description?: string
  status: Task['status']
  priority: Task['priority']
  assigneeEmails: string[]
  deadline?: string
}

export interface PaginationDto {
  page?: number
  size?: number
  
  q?: string
  status?: Status
  priority?: Priority
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  size: number
  total: number
  totalPages: number
}
