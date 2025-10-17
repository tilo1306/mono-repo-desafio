import { describe, expect, it } from 'vitest'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { render, screen } from '../../test-utils'

describe('Select Components', () => {
  describe('Select', () => {
    it('should render with default props', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>,
      )

      expect(screen.getByText('Select an option')).toBeInTheDocument()
    })
  })

  describe('SelectTrigger', () => {
    it('should render trigger button', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>,
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(
        <Select>
          <SelectTrigger className="custom-trigger">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>,
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveClass('custom-trigger')
    })
  })

  describe('SelectValue', () => {
    it('should render placeholder text', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>,
      )

      expect(screen.getByText('Select an option')).toBeInTheDocument()
    })

    it('should render selected value', () => {
      render(
        <Select defaultValue="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>,
      )

      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })
  })

  describe('SelectContent', () => {
    it('should render content', () => {
      render(
        <Select open>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>,
      )

      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(
        <Select open>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent className="custom-content">
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>,
      )

      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })
  })

  describe('SelectItem', () => {
    it('should render menu item', () => {
      render(
        <Select open>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>,
      )

      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(
        <Select open>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1" className="custom-item">
              Option 1
            </SelectItem>
          </SelectContent>
        </Select>,
      )

      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })
  })
})
