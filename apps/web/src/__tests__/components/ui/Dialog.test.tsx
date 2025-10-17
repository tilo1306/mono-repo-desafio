import { describe, expect, it } from 'vitest'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog'
import { render, screen } from '../../test-utils'

describe('Dialog Components', () => {
  describe('Dialog', () => {
    it('should render with default props', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>,
      )

      expect(screen.getByText('Open Dialog')).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(
        <Dialog>
          <DialogTrigger className="custom-trigger">Open Dialog</DialogTrigger>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>,
      )

      expect(screen.getByText('Open Dialog')).toHaveClass('custom-trigger')
    })
  })

  describe('DialogTrigger', () => {
    it('should render as a button by default', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>,
      )

      const trigger = screen.getByRole('button', { name: 'Open Dialog' })
      expect(trigger).toBeInTheDocument()
    })

    it('should render as a link when asChild is true', () => {
      render(
        <Dialog>
          <DialogTrigger asChild>
            <a href="#dialog">Open Dialog</a>
          </DialogTrigger>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>,
      )

      const trigger = screen.getByRole('link', { name: 'Open Dialog' })
      expect(trigger).toBeInTheDocument()
      expect(trigger).toHaveAttribute('href', '#dialog')
    })
  })

  describe('DialogContent', () => {
    it('should render content', () => {
      render(
        <Dialog open>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>,
      )

      expect(screen.getByText('Dialog content')).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(
        <Dialog open>
          <DialogContent className="custom-content">
            Dialog content
          </DialogContent>
        </Dialog>,
      )

      expect(screen.getByText('Dialog content')).toHaveClass('custom-content')
    })
  })

  describe('DialogHeader', () => {
    it('should render header content', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>Header content</DialogHeader>
          </DialogContent>
        </Dialog>,
      )

      expect(screen.getByText('Header content')).toBeInTheDocument()
    })
  })

  describe('DialogTitle', () => {
    it('should render title', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>,
      )

      expect(
        screen.getByRole('heading', { name: 'Dialog Title' }),
      ).toBeInTheDocument()
    })
  })

  describe('DialogDescription', () => {
    it('should render description', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>,
      )

      expect(screen.getByText('Dialog description')).toBeInTheDocument()
    })
  })
})
