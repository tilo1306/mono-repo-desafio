import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test-utils'
import { Separator } from '../../../components/ui/separator'

describe('Separator', () => {
  it('should render horizontal separator by default', () => {
    render(<Separator />)
    
    const separator = screen.getByRole('none')
    expect(separator).toBeInTheDocument()
    expect(separator).toHaveAttribute('data-orientation', 'horizontal')
  })

  it('should render vertical separator when orientation is vertical', () => {
    render(<Separator orientation="vertical" />)
    
    const separator = screen.getByRole('none')
    expect(separator).toBeInTheDocument()
    expect(separator).toHaveAttribute('data-orientation', 'vertical')
  })

  it('should accept custom className', () => {
    render(<Separator className="custom-separator" />)
    
    const separator = screen.getByRole('none')
    expect(separator).toHaveClass('custom-separator')
  })

  it('should be accessible', () => {
    render(<Separator />)
    
    const separator = screen.getByRole('none')
    expect(separator).toBeInTheDocument()
  })

  it('should render with decorative prop', () => {
    render(<Separator decorative />)
    
    const separator = screen.getByRole('none')
    expect(separator).toBeInTheDocument()
  })
})
