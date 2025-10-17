import { describe, expect, it } from 'vitest'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { render, screen } from '../../test-utils'

describe('Avatar Components', () => {
  describe('Avatar', () => {
    it('should render with default props', () => {
      render(<Avatar>Avatar content</Avatar>)

      const avatar = screen.getByText('Avatar content')
      expect(avatar).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(<Avatar className="custom-avatar">Avatar content</Avatar>)

      const avatar = screen.getByText('Avatar content')
      expect(avatar).toHaveClass('custom-avatar')
    })
  })

  describe('AvatarFallback', () => {
    it('should render fallback text', () => {
      render(
        <Avatar>
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>,
      )

      expect(screen.getByText('AB')).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(
        <Avatar>
          <AvatarFallback className="custom-fallback">AB</AvatarFallback>
        </Avatar>,
      )

      expect(screen.getByText('AB')).toHaveClass('custom-fallback')
    })
  })
})
