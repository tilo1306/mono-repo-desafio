import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '../../test-utils'
import { Badge } from '../../../components/ui/badge'

describe('Badge', () => {
  it('should render with default variant', () => {
    render(<Badge>Default Badge</Badge>)
    
    const badge = screen.getByText('Default Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-primary')
  })

  it('should render with different variants', () => {
    const { rerender } = render(<Badge variant="secondary">Secondary</Badge>)
    expect(screen.getByText('Secondary')).toHaveClass('bg-secondary')

    rerender(<Badge variant="destructive">Destructive</Badge>)
    expect(screen.getByText('Destructive')).toHaveClass('bg-destructive')

    rerender(<Badge variant="outline">Outline</Badge>)
    expect(screen.getByText('Outline')).toHaveClass('text-foreground')
  })

  it('should accept custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>)
    
    const badge = screen.getByText('Custom Badge')
    expect(badge).toHaveClass('custom-class')
  })

  it('should be accessible', () => {
    render(<Badge>Accessible Badge</Badge>)
    
    const badge = screen.getByText('Accessible Badge')
    expect(badge).toBeInTheDocument()
  })
})
