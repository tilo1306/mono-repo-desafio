import { api } from '@/lib/util/axios'
import type { ResponseUpdateAvatar } from './type'

export async function updateUserAvatar(
  data: FormData,
): Promise<ResponseUpdateAvatar> {
  const response = await api.post('/auth/upload-avatar', data)
  return response.data
}
