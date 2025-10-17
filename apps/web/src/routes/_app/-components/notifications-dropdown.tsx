import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotifications } from '@/hooks/use-notifications'
import { Bell, CheckCheck } from 'lucide-react'

export function NotificationsDropdown() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAllAsRead,
  } = useNotifications()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return '👤'
      case 'status_changed':
        return '🔄'
      case 'new_comment':
        return '💬'
      default:
        return '🔔'
    }
  }

  const trigger = (
    <Button variant="ghost" size="sm" className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  )

  const contentBody = (
    <div className="max-h-96 overflow-y-auto p-4">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="h-3 w-1/2 rounded bg-gray-200"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center">
          <Bell className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>Nenhuma notificação encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <Card
              key={notification.id}
              className={`hover:bg-accent/50 cursor-pointer transition-colors ${
                !notification.isRead ? 'border-l-primary border-l-4' : ''
              }`}
              onClick={() => {
                if (!notification.isRead) {
                  markAsRead(notification.id)
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="truncate text-sm font-medium">
                        {notification.title}
                      </h4>
                    </div>
                    <p className="text-muted-foreground mb-2 text-sm">
                      {notification.message}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="flex-shrink-0">
                      <div className="bg-primary h-2 w-2 rounded-full"></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const headerRight = (
    <>
      {unreadCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={markAllAsRead}
          disabled={isMarkingAllAsRead}
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Marcar todas
        </Button>
      )}
    </>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0" align="end" sideOffset={5}>
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="text-sm font-semibold">Notificações</h3>
            <p className="text-muted-foreground text-xs">
              {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Todas lidas'}
            </p>
          </div>
          {headerRight}
        </div>
        {contentBody}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
