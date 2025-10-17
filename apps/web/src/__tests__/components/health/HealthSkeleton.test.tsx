import { describe, expect, it } from 'vitest'
import { HealthSkeleton } from '../../../components/health/health-skeleton'
import { render, screen } from '../../test-utils'

describe('HealthSkeleton', () => {
  it('should render skeleton components', () => {
    render(<HealthSkeleton />)

    // Check if skeleton elements are rendered by looking for animate-pulse class
    const skeletons = screen.getAllByRole('generic').filter(el => 
      el.className.includes('animate-pulse')
    )
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should render main card skeleton', () => {
    render(<HealthSkeleton />)

    // The main card should be present
    const cards = screen
      .getAllByRole('generic')
      .filter(el => el.getAttribute('data-slot') === 'card')
    expect(cards.length).toBeGreaterThan(0)
  })

  it('should render service card skeletons', () => {
    render(<HealthSkeleton />)

    // Should render multiple cards for services
    const cards = screen
      .getAllByRole('generic')
      .filter(el => el.getAttribute('data-slot') === 'card')
    expect(cards.length).toBeGreaterThanOrEqual(3) // 1 main + 2 service cards
  })

  it('should have proper structure', () => {
    render(<HealthSkeleton />)

    // Check if the main container exists by looking for the first div
    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
  })

  it('should render skeleton elements with different sizes', () => {
    render(<HealthSkeleton />)

    // Check if different skeleton sizes are rendered
    const skeletons = screen.getAllByRole('generic')
    const hasDifferentSizes = skeletons.some(
      el =>
        el.className.includes('h-12') ||
        el.className.includes('h-6') ||
        el.className.includes('h-4'),
    )
    expect(hasDifferentSizes).toBe(true)
  })

  it('should be accessible', () => {
    render(<HealthSkeleton />)

    // Skeleton should not have interactive elements
    const buttons = screen.queryAllByRole('button')
    const links = screen.queryAllByRole('link')

    expect(buttons).toHaveLength(0)
    expect(links).toHaveLength(0)
  })
})
