import { api } from '@/lib/util/axios'
import type { UsersResponse } from './type'

interface GetUsersParams {
  page?: number
  limit?: number
  email?: string
}

export async function getUsers(
  params: GetUsersParams = {},
): Promise<UsersResponse> {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.append('page', params.page.toString())
  if (params.limit) searchParams.append('limit', params.limit.toString())
  if (params.email) searchParams.append('email', params.email)

  const response = await api.get(`/auth/users?${searchParams.toString()}`)
  return response.data
}
