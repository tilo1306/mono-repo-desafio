import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  name: string
  email: string
  avatar: string
}

interface UserState {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    set => ({
      user: null,
      setUser: (user: User) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'user-storage',
    },
  ),
)
