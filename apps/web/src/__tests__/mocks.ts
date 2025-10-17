import { vi } from 'vitest'

// Mock do TanStack Router
export const mockRouter = {
  navigate: vi.fn(),
  location: {
    pathname: '/',
    search: '',
    hash: '',
  },
  params: {},
  search: {},
}

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: any) => {
    const React = require('react')
    return React.createElement('a', { href: to, ...props }, children)
  },
  Router: ({ children }: { children: React.ReactNode }) => {
    const React = require('react')
    return React.createElement('div', {}, children)
  },
  useNavigate: () => mockRouter.navigate,
  useLocation: () => mockRouter.location,
  useParams: () => mockRouter.params,
  useSearch: () => mockRouter.search,
}))

// Mock do React Query DevTools
vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => null,
}))

// Mock do Socket.io
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
  })),
}))

// Mock do GSAP
vi.mock('gsap', () => ({
  gsap: {
    to: vi.fn(),
    from: vi.fn(),
    timeline: vi.fn(() => ({
      to: vi.fn(),
      from: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
    })),
  },
}))

// Mock do Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    p: 'p',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock do Next Themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    resolvedTheme: 'light',
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock do Zustand stores
vi.mock('../../stores/token-store', () => ({
  useTokenStore: () => ({
    token: null,
    setToken: vi.fn(),
    clearToken: vi.fn(),
  }),
}))

vi.mock('../../stores/user-store', () => ({
  useUserStore: () => ({
    user: null,
    setUser: vi.fn(),
    clearUser: vi.fn(),
  }),
}))
