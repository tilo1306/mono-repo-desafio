import { BookOpenText, Heart, Kanban, Table, User, Users } from 'lucide-react'

interface SideBarMenu {
  label: string
  href: string
  icon: React.ElementType
  external?: boolean
}

export const SIDE_BAR_MENU: SideBarMenu[] = [
  { label: 'Kanban', href: '/dashboard/kaban', icon: Kanban },
  { label: 'Tabela', href: '/dashboard/tabela', icon: Table },
  { label: 'Usuários', href: '/dashboard/usuarios', icon: Users },
  { label: 'Health', href: '/dashboard/health', icon: Heart },
  {
    label: 'API Docs',
    href: 'http://localhost:3001/api/docs',
    icon: BookOpenText,
    external: true,
  },
]

export const SIDE_BAR_MENU_USER: SideBarMenu[] = [
  { label: 'Perfil', href: '/dashboard/perfil', icon: User },
]
