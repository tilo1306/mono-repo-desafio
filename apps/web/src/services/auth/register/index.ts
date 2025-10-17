import { api } from '@/lib/util/axios'
import { type RegisterFormData } from '@/schemas/register'
import type { RegisterResponse } from './type'

export async function register(
  data: RegisterFormData,
): Promise<RegisterResponse> {
  const response = await api.post('/auth/register', {
    name: data.name,
    email: data.email,
    password: data.password,
  })
  return response.data
}
