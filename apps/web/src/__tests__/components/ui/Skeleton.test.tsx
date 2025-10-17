import { describe, expect, it } from 'vitest'
import { Skeleton } from '../../../components/ui/skeleton'
import { render, screen } from '../../test-utils'

describe('Skeleton', () => {
  it('should render skeleton with default props', () => {
    render(<Skeleton />)

    const skeletons = screen.getAllByRole('generic')
    const skeleton = skeletons.find(el =>
      el.className.includes('animate-pulse'),
    )
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveClass('animate-pulse')
    expect(skeleton).toHaveClass('rounded-md')
    expect(skeleton).toHaveClass('bg-muted')
  })

  it('should render skeleton with custom className', () => {
    render(<Skeleton className="custom-skeleton" />)

    const skeletons = screen.getAllByRole('generic')
    const skeleton = skeletons.find(el =>
      el.className.includes('custom-skeleton'),
    )
    expect(skeleton).toHaveClass('custom-skeleton')
    expect(skeleton).toHaveClass('animate-pulse')
  })

  it('should render skeleton with different sizes', () => {
    const { rerender } = render(<Skeleton className="h-4 w-4" />)
    const skeletons1 = screen.getAllByRole('generic')
    const skeleton1 = skeletons1.find(el => el.className.includes('h-4'))
    expect(skeleton1).toHaveClass('h-4', 'w-4')

    rerender(<Skeleton className="h-8 w-8" />)
    const skeletons2 = screen.getAllByRole('generic')
    const skeleton2 = skeletons2.find(el => el.className.includes('h-8'))
    expect(skeleton2).toHaveClass('h-8', 'w-8')
  })

  it('should render skeleton with rounded corners', () => {
    render(<Skeleton className="rounded-full" />)

    const skeletons = screen.getAllByRole('generic')
    const skeleton = skeletons.find(el => el.className.includes('rounded-full'))
    expect(skeleton).toHaveClass('rounded-full')
  })

  it('should render multiple skeletons', () => {
    render(
      <div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>,
    )

    const skeletons = screen
      .getAllByRole('generic')
      .filter(el => el.className.includes('animate-pulse'))
    expect(skeletons).toHaveLength(3)
    skeletons.forEach(skeleton => {
      expect(skeleton).toHaveClass('animate-pulse')
    })
  })

  it('should render skeleton with custom animation', () => {
    render(<Skeleton className="animate-bounce" />)

    const skeletons = screen.getAllByRole('generic')
    const skeleton = skeletons.find(el =>
      el.className.includes('animate-bounce'),
    )
    expect(skeleton).toHaveClass('animate-bounce')
  })
})
