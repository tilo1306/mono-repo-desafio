import api from '@/lib/util/axios'
import type { RefreshTokenResponse } from './type'

export async function refreshToken(data: {
  refreshToken: string
}): Promise<RefreshTokenResponse> {
  const response = await api.post('/auth/refresh', data, {
    withCredentials: true,
  })
  return response.data
}
