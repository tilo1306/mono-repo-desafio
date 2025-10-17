import { api } from '@/lib/util/axios'
import type { PaginatedResponse, PaginationDto, Task } from './type'

export async function createTask(task: any) {
  const response = await api.post('/tasks', task)
  return response.data
}

export async function getTasksPaginated(
  params: PaginationDto = {},
): Promise<PaginatedResponse<Task>> {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.append('page', params.page.toString())
  if (params.size) searchParams.append('size', params.size.toString())
  if (params.q) searchParams.append('q', params.q)
  if (params.status) searchParams.append('status', params.status)
  if (params.priority) searchParams.append('priority', params.priority)

  const response = await api.get(`/tasks?${searchParams.toString()}`)
  return response.data
}

export async function updateTaskStatus(taskId: string, status: Task['status']) {
  const response = await api.put(`/tasks/${taskId}`, { status })
  return response.data
}

export async function updateTask(taskId: string, task: any) {
  const response = await api.put(`/tasks/${taskId}`, task)
  return response.data
}

export async function deleteTask(taskId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}`)
}
