import { describe, expect, it } from 'vitest'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../../components/ui/breadcrumb'
import { render, screen } from '../../test-utils'

describe('Breadcrumb Components', () => {
  describe('Breadcrumb', () => {
    it('should render breadcrumb navigation', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current Page</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>,
      )

      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(
        <Breadcrumb className="custom-breadcrumb">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Page</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>,
      )

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('custom-breadcrumb')
    })
  })

  describe('BreadcrumbList', () => {
    it('should render breadcrumb list', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Page</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>,
      )

      expect(screen.getByRole('list')).toBeInTheDocument()
    })
  })

  describe('BreadcrumbItem', () => {
    it('should render breadcrumb item', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Page</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>,
      )

      expect(screen.getByRole('listitem')).toBeInTheDocument()
    })
  })

  describe('BreadcrumbLink', () => {
    it('should render breadcrumb link', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/home">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>,
      )

      const link = screen.getByRole('link', { name: 'Home' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/home')
    })
  })

  describe('BreadcrumbPage', () => {
    it('should render current page', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Current Page</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>,
      )

      expect(screen.getByText('Current Page')).toBeInTheDocument()
    })
  })
})
