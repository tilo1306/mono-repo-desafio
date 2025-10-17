import { describe, expect, it } from 'vitest'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs'
import { render, screen } from '../../test-utils'

describe('Tabs Components', () => {
  describe('Tabs', () => {
    it('should render with default props', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>,
      )

      expect(screen.getByText('Tab 1')).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(
        <Tabs defaultValue="tab1" className="custom-tabs">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>,
      )

      expect(screen.getByText('Tab 1')).toBeInTheDocument()
    })
  })

  describe('TabsList', () => {
    it('should render tabs list', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>,
      )

      expect(screen.getByText('Tab 1')).toBeInTheDocument()
      expect(screen.getByText('Tab 2')).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList className="custom-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>,
      )

      expect(screen.getByText('Tab 1')).toBeInTheDocument()
    })
  })

  describe('TabsTrigger', () => {
    it('should render tab trigger', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>,
      )

      const trigger = screen.getByRole('tab', { name: 'Tab 1' })
      expect(trigger).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" className="custom-trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>,
      )

      const trigger = screen.getByRole('tab', { name: 'Tab 1' })
      expect(trigger).toHaveClass('custom-trigger')
    })
  })

  describe('TabsContent', () => {
    it('should render tab content', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>,
      )

      expect(screen.getByText('Content 1')).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="custom-content">
            Content 1
          </TabsContent>
        </Tabs>,
      )

      expect(screen.getByText('Content 1')).toHaveClass('custom-content')
    })
  })
})
