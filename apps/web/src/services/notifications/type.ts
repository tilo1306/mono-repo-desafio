export interface Notification {
  id: string
  userId: string
  taskId: string
  type: 'task_assigned' | 'status_changed' | 'new_comment'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface NotificationResponse {
  data: Notification[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface MarkAsReadResponse {
  success: boolean
  message: string
}

export interface NotificationEvent {
  type: 'task_assigned' | 'status_changed' | 'new_comment'
  taskId: string
  userId: string
  message: string
  timestamp: string
}
