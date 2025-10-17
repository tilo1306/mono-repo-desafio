import api from '@/lib/util/axios'
import type { HealthResponse } from './type'

export async function getHealth(): Promise<HealthResponse> {
  const response = await api.get('/health')
  return response.data
}
