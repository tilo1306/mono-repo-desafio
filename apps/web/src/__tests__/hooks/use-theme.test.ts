import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTheme } from '../../hooks/use-theme'

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock do matchMedia
const mockMatchMedia = vi.fn()
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

describe('useTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    // Reset documentElement classes completely
    document.documentElement.className = ''

    // Reset localStorage completely
    localStorageMock.clear.mockClear()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
  })

  it('should initialize with light theme by default', () => {
    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('light')
  })

  it('should use saved theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('dark')

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('dark')
    expect(localStorageMock.getItem).toHaveBeenCalledWith('theme')
  })

  it('should use system preference when no saved theme', () => {
    localStorageMock.getItem.mockReturnValue(null)
    mockMatchMedia.mockReturnValue({
      matches: true, // prefers dark
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    // Mock window.matchMedia to return the mocked value
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('dark')
  })

  it('should set specific theme', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(result.current.theme).toBe('dark')

    act(() => {
      result.current.setTheme('light')
    })

    expect(result.current.theme).toBe('light')
  })

  it('should save theme to localStorage when changed', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
  })
})
