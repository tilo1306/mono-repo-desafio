import { describe, expect, it } from 'vitest'
import { Input } from '../../../components/ui/input'
import { fireEvent, render, screen } from '../../test-utils'

describe('Input', () => {
  it('should render with default props', () => {
    render(<Input />)

    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('data-slot', 'input')
  })

  it('should render with placeholder', () => {
    render(<Input placeholder="Enter your name" />)

    const input = screen.getByPlaceholderText('Enter your name')
    expect(input).toBeInTheDocument()
  })

  it('should render with different input types', () => {
    const { rerender } = render(<Input type="email" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')

    rerender(<Input type="password" />)
    expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password')

    rerender(<Input type="number" />)
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number')
  })

  it('should handle value changes', () => {
    render(<Input />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test value' } })

    expect(input).toHaveValue('test value')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />)

    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('should accept custom className', () => {
    render(<Input className="custom-class" />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-class')
  })

  it('should have proper accessibility attributes', () => {
    render(
      <Input
        aria-label="Username input"
        aria-describedby="username-help"
        aria-invalid="true"
      />,
    )

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-label', 'Username input')
    expect(input).toHaveAttribute('aria-describedby', 'username-help')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('should handle focus and blur events', () => {
    const handleFocus = vi.fn()
    const handleBlur = vi.fn()

    render(<Input onFocus={handleFocus} onBlur={handleBlur} />)

    const input = screen.getByRole('textbox')

    fireEvent.focus(input)
    expect(handleFocus).toHaveBeenCalledTimes(1)

    fireEvent.blur(input)
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('should handle keyboard events', () => {
    const handleKeyDown = vi.fn()
    const handleKeyUp = vi.fn()

    render(<Input onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />)

    const input = screen.getByRole('textbox')

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(handleKeyDown).toHaveBeenCalledTimes(1)

    fireEvent.keyUp(input, { key: 'Enter' })
    expect(handleKeyUp).toHaveBeenCalledTimes(1)
  })
})
