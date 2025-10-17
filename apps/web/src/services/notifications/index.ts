import { api } from '@/lib/util/axios'
import type { MarkAsReadResponse, NotificationResponse } from './type'

export async function getNotifications(params?: {
  page?: number
  limit?: number
  isRead?: boolean
}) {
  const response = await api.get<NotificationResponse>('/notifications', {
    params,
  })
  return response.data
}

export async function markNotificationAsRead(notificationId: string) {
  const response = await api.post<MarkAsReadResponse>(
    `/notifications/${notificationId}/read`,
  )
  return response.data
}

export async function markAllNotificationsAsRead() {
  const response = await api.post<MarkAsReadResponse>('/notifications/read-all')
  return response.data
}
