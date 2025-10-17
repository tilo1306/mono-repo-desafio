import { beforeEach, describe, expect, it } from 'vitest'
import { useUserStore } from '../../stores/user-store'

describe('useUserStore', () => {
  beforeEach(() => {
    // Clear store state before each test
    useUserStore.getState().clearUser()
  })

  it('should initialize with null user', () => {
    const state = useUserStore.getState()

    expect(state.user).toBeNull()
  })

  it('should set user correctly', () => {
    const user = {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://example.com/avatar.jpg',
    }

    useUserStore.getState().setUser(user)

    const state = useUserStore.getState()
    expect(state.user).toEqual(user)
  })

  it('should clear user correctly', () => {
    const user = {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://example.com/avatar.jpg',
    }

    // First set user
    useUserStore.getState().setUser(user)

    // Then clear user
    useUserStore.getState().clearUser()

    const state = useUserStore.getState()
    expect(state.user).toBeNull()
  })

  it('should update user when setUser is called multiple times', () => {
    const firstUser = {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://example.com/avatar1.jpg',
    }

    const secondUser = {
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: 'https://example.com/avatar2.jpg',
    }

    // Set first user
    useUserStore.getState().setUser(firstUser)

    let state = useUserStore.getState()
    expect(state.user).toEqual(firstUser)

    // Set second user
    useUserStore.getState().setUser(secondUser)

    state = useUserStore.getState()
    expect(state.user).toEqual(secondUser)
  })

  it('should handle partial user data', () => {
    const user = {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: '',
    }

    useUserStore.getState().setUser(user)

    const state = useUserStore.getState()
    expect(state.user).toEqual(user)
    expect(state.user?.name).toBe('John Doe')
    expect(state.user?.email).toBe('john@example.com')
    expect(state.user?.avatar).toBe('')
  })
})
