import api from '@/lib/util/axios'
import type { ProfileResponse } from './type'

export async function getUserProfile(): Promise<ProfileResponse> {
  const response = await api.get('/auth/profile')
  return response.data
}
