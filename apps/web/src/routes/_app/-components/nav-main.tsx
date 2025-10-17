import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { SIDE_BAR_MENU } from '@/constants/side-bar-menu'
import { Link } from '@tanstack/react-router'

export function NavMain() {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {SIDE_BAR_MENU.map(item => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton asChild tooltip={item.label}>
                {item.external ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.icon && <item.icon />}
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <Link to={item.href}>
                    {item.icon && <item.icon />}
                    <span>{item.label}</span>
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
