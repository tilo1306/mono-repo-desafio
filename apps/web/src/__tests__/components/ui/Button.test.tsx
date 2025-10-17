import { describe, expect, it, vi } from 'vitest'
import { Button } from '../../../components/ui/button'
import { fireEvent, render, screen } from '../../test-utils'

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Clique aqui</Button>)

    expect(
      screen.getByRole('button', { name: 'Clique aqui' }),
    ).toBeInTheDocument()
  })

  it('should execute onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Clique aqui</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Botão desabilitado</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should apply variants correctly', () => {
    const { rerender } = render(
      <Button variant="destructive">Destrutivo</Button>,
    )
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')

    rerender(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button')).toHaveClass('border')

    rerender(<Button variant="secondary">Secundário</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-secondary')

    rerender(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button')).toHaveClass('hover:bg-accent')

    rerender(<Button variant="link">Link</Button>)
    expect(screen.getByRole('button')).toHaveClass('text-primary')
  })

  it('should apply sizes correctly', () => {
    const { rerender } = render(<Button size="sm">Pequeno</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-8')

    rerender(<Button size="lg">Grande</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-10')

    rerender(<Button size="icon">Ícone</Button>)
    expect(screen.getByRole('button')).toHaveClass('size-9')
  })

  it('should accept custom className', () => {
    render(<Button className="custom-class">Customizado</Button>)

    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('should render as Slot when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link como botão</a>
      </Button>,
    )

    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })

  it('should have accessibility attributes', () => {
    render(
      <Button aria-label="Botão de teste" aria-describedby="desc">
        Teste
      </Button>,
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Botão de teste')
    expect(button).toHaveAttribute('aria-describedby', 'desc')
  })
})
