import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test-utils'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../../components/ui/table'

describe('Table Components', () => {
  describe('Table', () => {
    it('should render table', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(
        <Table className="custom-table">
          <TableBody>
            <TableRow>
              <TableCell>Cell content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )

      const table = screen.getByRole('table')
      expect(table).toHaveClass('custom-table')
    })
  })

  describe('TableHeader', () => {
    it('should render table header', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )

      expect(screen.getByRole('columnheader', { name: 'Header' })).toBeInTheDocument()
    })
  })

  describe('TableBody', () => {
    it('should render table body', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )

      expect(screen.getByRole('rowgroup')).toBeInTheDocument()
    })
  })

  describe('TableRow', () => {
    it('should render table row', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )

      expect(screen.getByRole('row')).toBeInTheDocument()
    })
  })

  describe('TableHead', () => {
    it('should render table head cell', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header Cell</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )

      const header = screen.getByRole('columnheader', { name: 'Header Cell' })
      expect(header).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="custom-header">Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )

      const header = screen.getByRole('columnheader')
      expect(header).toHaveClass('custom-header')
    })
  })

  describe('TableCell', () => {
    it('should render table cell', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )

      const cell = screen.getByRole('cell', { name: 'Cell content' })
      expect(cell).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="custom-cell">Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )

      const cell = screen.getByRole('cell')
      expect(cell).toHaveClass('custom-cell')
    })
  })

  it('should render a complete table structure', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
            <TableCell>Admin</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jane Smith</TableCell>
            <TableCell>jane@example.com</TableCell>
            <TableCell>User</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Role' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'John Doe' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'john@example.com' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Admin' })).toBeInTheDocument()
  })
})

