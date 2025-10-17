import api from '@/lib/util/axios'
import type { UpdatePasswordFormData } from '@/schemas/update-password'

export async function updatePassword(
  data: UpdatePasswordFormData,
): Promise<void> {
  const response = await api.post('/auth/password', {
    password: data.password,
    newPassword: data.newPassword,
  })
  return response.data
}
