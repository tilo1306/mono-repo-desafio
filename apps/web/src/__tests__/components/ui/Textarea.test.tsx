import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '../../test-utils'
import { Textarea } from '../../../components/ui/textarea'

describe('Textarea', () => {
  it('should render with default props', () => {
    render(<Textarea />)

    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
  })

  it('should render with placeholder', () => {
    render(<Textarea placeholder="Enter your message" />)

    const textarea = screen.getByPlaceholderText('Enter your message')
    expect(textarea).toBeInTheDocument()
  })

  it('should display value correctly', () => {
    render(<Textarea value="Test message" onChange={() => {}} />)

    expect(screen.getByDisplayValue('Test message')).toBeInTheDocument()
  })

  it('should call onChange handler when value changes', () => {
    const handleChange = vi.fn()
    render(<Textarea onChange={handleChange} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'new message' } })

    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith(expect.any(Object))
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Textarea disabled />)

    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('should be readOnly when readOnly prop is true', () => {
    render(<Textarea readOnly />)

    expect(screen.getByRole('textbox')).toHaveAttribute('readonly')
  })

  it('should accept custom className', () => {
    render(<Textarea className="custom-textarea" />)

    expect(screen.getByRole('textbox')).toHaveClass('custom-textarea')
  })

  it('should forward ref', () => {
    const ref = vi.fn()
    render(<Textarea ref={ref} />)

    expect(ref).toHaveBeenCalledWith(expect.any(HTMLTextAreaElement))
  })

  it('should accept rows and cols props', () => {
    render(<Textarea rows={5} cols={30} />)

    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('rows', '5')
    expect(textarea).toHaveAttribute('cols', '30')
  })
})

