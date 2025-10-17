import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface tokenState {
  accessToken: string | null
  refreshToken: string | null
  setTokens: (token: string, refreshToken: string) => void
  clearToken: () => void
}

export const useAuthStore = create<tokenState>()(
  persist(
    set => ({
      accessToken: null,
      refreshToken: null,
      setTokens: (token, refreshToken) =>
        set({ accessToken: token, refreshToken }),
      clearToken: () => set({ accessToken: null, refreshToken: null }),
    }),
    {
      name: 'auth-storage',
    },
  ),
)
