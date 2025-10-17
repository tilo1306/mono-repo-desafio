import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '../../test-utils'
import { Label } from '../../../components/ui/label'

describe('Label', () => {
  it('should render with text', () => {
    render(<Label>Test Label</Label>)
    
    const label = screen.getByText('Test Label')
    expect(label).toBeInTheDocument()
    expect(label).toHaveAttribute('data-slot', 'label')
  })

  it('should accept custom className', () => {
    render(<Label className="custom-label">Custom Label</Label>)
    
    const label = screen.getByText('Custom Label')
    expect(label).toHaveClass('custom-label')
  })

  it('should be associated with form elements', () => {
    render(
      <div>
        <Label htmlFor="test-input">Test Label</Label>
        <input id="test-input" type="text" />
      </div>
    )
    
    const label = screen.getByText('Test Label')
    const input = screen.getByRole('textbox')
    
    expect(label).toHaveAttribute('for', 'test-input')
    expect(input).toHaveAttribute('id', 'test-input')
  })

  it('should handle click events', () => {
    const handleClick = vi.fn()
    render(<Label onClick={handleClick}>Clickable Label</Label>)
    
    fireEvent.click(screen.getByText('Clickable Label'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be accessible', () => {
    render(<Label>Accessible Label</Label>)
    
    const label = screen.getByText('Accessible Label')
    expect(label).toBeInTheDocument()
  })
})

