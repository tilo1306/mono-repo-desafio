import { describe, expect, it } from 'vitest'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
import { render, screen } from '../../test-utils'

describe('Card Components', () => {
  describe('Card', () => {
    it('should render with default props', () => {
      render(<Card>Card content</Card>)

      const card = screen.getByText('Card content')
      expect(card).toBeInTheDocument()
      expect(card).toHaveAttribute('data-slot', 'card')
    })

    it('should accept custom className', () => {
      render(<Card className="custom-card">Card content</Card>)

      const card = screen.getByText('Card content')
      expect(card).toHaveClass('custom-card')
    })

    it('should render children correctly', () => {
      render(
        <Card>
          <div>Child content</div>
        </Card>,
      )

      expect(screen.getByText('Child content')).toBeInTheDocument()
    })
  })

  describe('CardHeader', () => {
    it('should render with default props', () => {
      render(<CardHeader>Header content</CardHeader>)

      const header = screen.getByText('Header content')
      expect(header).toBeInTheDocument()
      expect(header).toHaveAttribute('data-slot', 'card-header')
    })

    it('should accept custom className', () => {
      render(<CardHeader className="custom-header">Header content</CardHeader>)

      const header = screen.getByText('Header content')
      expect(header).toHaveClass('custom-header')
    })
  })

  describe('CardTitle', () => {
    it('should render with default props', () => {
      render(<CardTitle>Card Title</CardTitle>)

      const title = screen.getByText('Card Title')
      expect(title).toBeInTheDocument()
      expect(title).toHaveAttribute('data-slot', 'card-title')
    })

    it('should accept custom className', () => {
      render(<CardTitle className="custom-title">Card Title</CardTitle>)

      const title = screen.getByText('Card Title')
      expect(title).toHaveClass('custom-title')
    })
  })

  describe('CardDescription', () => {
    it('should render with default props', () => {
      render(<CardDescription>Card description</CardDescription>)

      const description = screen.getByText('Card description')
      expect(description).toBeInTheDocument()
      expect(description).toHaveAttribute('data-slot', 'card-description')
    })

    it('should accept custom className', () => {
      render(
        <CardDescription className="custom-description">
          Card description
        </CardDescription>,
      )

      const description = screen.getByText('Card description')
      expect(description).toHaveClass('custom-description')
    })
  })

  describe('CardContent', () => {
    it('should render with default props', () => {
      render(<CardContent>Card content</CardContent>)

      const content = screen.getByText('Card content')
      expect(content).toBeInTheDocument()
      expect(content).toHaveAttribute('data-slot', 'card-content')
    })

    it('should accept custom className', () => {
      render(<CardContent className="custom-content">Card content</CardContent>)

      const content = screen.getByText('Card content')
      expect(content).toHaveClass('custom-content')
    })
  })

  describe('CardFooter', () => {
    it('should render with default props', () => {
      render(<CardFooter>Footer content</CardFooter>)

      const footer = screen.getByText('Footer content')
      expect(footer).toBeInTheDocument()
      expect(footer).toHaveAttribute('data-slot', 'card-footer')
    })

    it('should accept custom className', () => {
      render(<CardFooter className="custom-footer">Footer content</CardFooter>)

      const footer = screen.getByText('Footer content')
      expect(footer).toHaveClass('custom-footer')
    })
  })

  describe('CardAction', () => {
    it('should render with default props', () => {
      render(<CardAction>Action content</CardAction>)

      const action = screen.getByText('Action content')
      expect(action).toBeInTheDocument()
      expect(action).toHaveAttribute('data-slot', 'card-action')
    })

    it('should accept custom className', () => {
      render(<CardAction className="custom-action">Action content</CardAction>)

      const action = screen.getByText('Action content')
      expect(action).toHaveClass('custom-action')
    })
  })

  describe('Complete Card Structure', () => {
    it('should render a complete card with all components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>This is a test card</CardDescription>
            <CardAction>
              <button>Action</button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p>This is the card content</p>
          </CardContent>
          <CardFooter>
            <button>Footer Button</button>
          </CardFooter>
        </Card>,
      )

      expect(screen.getByText('Test Card')).toBeInTheDocument()
      expect(screen.getByText('This is a test card')).toBeInTheDocument()
      expect(screen.getByText('This is the card content')).toBeInTheDocument()
      expect(screen.getByText('Action')).toBeInTheDocument()
      expect(screen.getByText('Footer Button')).toBeInTheDocument()
    })
  })
})
