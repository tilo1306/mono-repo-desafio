import { api } from '@/lib/util/axios'
import type { LoginFormData } from '@/schemas/login'
import type { LoginResponse } from './type'

export async function login(data: LoginFormData): Promise<LoginResponse> {
  const response = await api.post('/auth/login', data, {
    withCredentials: false,
  })
  return response.data
}
