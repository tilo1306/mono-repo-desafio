import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useIsMobile } from '../../hooks/use-mobile'

// Mock do window.matchMedia
const mockMatchMedia = vi.fn()
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

// Mock do window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  value: 1024,
})

describe('useIsMobile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  it('should return false for desktop screen size', () => {
    window.innerWidth = 1024
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })

  it('should return true for mobile screen size', () => {
    window.innerWidth = 600
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('should handle screen size changes', () => {
    let changeCallback: (() => void) | null = null
    const addEventListener = vi.fn((event, callback) => {
      if (event === 'change') {
        changeCallback = callback
      }
    })
    const removeEventListener = vi.fn()

    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener,
      removeEventListener,
    })

    const { result } = renderHook(() => useIsMobile())

    // Simulate screen size change
    window.innerWidth = 600
    if (changeCallback) {
      changeCallback()
    }

    expect(result.current).toBe(true)
  })
})
