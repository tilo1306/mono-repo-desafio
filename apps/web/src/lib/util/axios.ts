import { useAuthStore } from '@/stores/token-store'
import Axios, { type InternalAxiosRequestConfig } from 'axios'

export const api = Axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: false,
})

const authRequestInterceptor = (config: InternalAxiosRequestConfig) => {
  if (config.headers) {
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json'
    }

    config.headers['Timezone-Val'] =
      Intl.DateTimeFormat().resolvedOptions().timeZone

    const { accessToken, refreshToken } = useAuthStore.getState()

    if (accessToken) {
      config.headers['authorization'] = `Bearer ${accessToken}`
      config.withCredentials = true
    } else if (refreshToken) {
      config.withCredentials = true
    }
  }
  return config
}

api.interceptors.request.use(authRequestInterceptor)

export default api
