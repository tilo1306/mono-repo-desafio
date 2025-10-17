import { describe, expect, it } from 'vitest'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import { render, screen } from '../../test-utils'

describe('DropdownMenu Components', () => {
  describe('DropdownMenu', () => {
    it('should render with default props', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      )

      expect(screen.getByText('Open Menu')).toBeInTheDocument()
    })
  })

  describe('DropdownMenuTrigger', () => {
    it('should render as a button by default', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      )

      const trigger = screen.getByRole('button', { name: 'Open Menu' })
      expect(trigger).toBeInTheDocument()
    })

    it('should render as a link when asChild is true', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <a href="#menu">Open Menu</a>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      )

      const trigger = screen.getByRole('link', { name: 'Open Menu' })
      expect(trigger).toBeInTheDocument()
      expect(trigger).toHaveAttribute('href', '#menu')
    })
  })

  describe('DropdownMenuContent', () => {
    it('should render content', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuContent>Menu content</DropdownMenuContent>
        </DropdownMenu>,
      )

      expect(screen.getByText('Menu content')).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuContent className="custom-content">
            Menu content
          </DropdownMenuContent>
        </DropdownMenu>,
      )

      expect(screen.getByText('Menu content')).toHaveClass('custom-content')
    })
  })

  describe('DropdownMenuItem', () => {
    it('should render menu item', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuContent>
            <DropdownMenuItem>Menu Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      )

      expect(screen.getByText('Menu Item')).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(
        <DropdownMenu open>
          <DropdownMenuContent>
            <DropdownMenuItem className="custom-item">
              Menu Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      )

      expect(screen.getByText('Menu Item')).toHaveClass('custom-item')
    })
  })
})
