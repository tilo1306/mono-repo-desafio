import { api } from '@/lib/util/axios'
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/services/notifications'
import type { Notification } from '@/services/notifications/type'
import { useAuthStore } from '@/stores/token-store'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { jwtDecode } from 'jwt-decode'
import { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import { toast } from 'sonner'

function getUserIdFromToken(): string | null {
  const token = useAuthStore.getState().accessToken
  if (!token) return null

  try {
    const payload = jwtDecode<{ sub?: string; userId?: string }>(token)
    return payload.sub || payload.userId || null
  } catch (error) {
    return null
  }
}

export function useNotifications() {
  const queryClient = useQueryClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [socket, setSocket] = useState<any>(null)

  const userId = getUserIdFromToken()
  const { accessToken } = useAuthStore.getState()
  const wsBaseUrl = useMemo(() => {
    try {
      const axiosBase =
        (api as any)?.defaults?.baseURL || 'http://localhost:3001/api'
      const origin = new URL(axiosBase).origin
      return origin
    } catch {
      return 'http://localhost:3001'
    }
  }, [])

  useEffect(() => {
    if (!userId) {
      return
    }

    const newSocket = io(`${wsBaseUrl}/ws/notifications`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: {
        token: accessToken || '',
        userId,
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
      timeout: 10000,
      forceNew: true,
      withCredentials: true,
      transportOptions: {
        polling: {
          extraHeaders: {},
          withCredentials: true,
        },
      },
    })

    newSocket.on('connect', () => {
      newSocket.emit('authenticate', {
        userId: userId,
      })
    })

    newSocket.on('authenticated', () => {})

    newSocket.on('authentication_failed', () => {
      console.error('Falha na autenticação do WebSocket')
    })

    const mapEventNameToType = (eventName?: string): Notification['type'] => {
      switch (eventName) {
        case 'comment:new':
          return 'new_comment'
        case 'task:assigned':
          return 'task_assigned'
        case 'task:status':
          return 'status_changed'
        case 'task:created':
        case 'task_created':
        case 'task:updated':
        case 'task_updated':
          return 'status_changed'
        default:
          return 'new_comment'
      }
    }

    const handleIncoming = (payload: any, eventName?: string) => {
      try {
        const nowIso = new Date().toISOString()
        const normalized: Notification = {
          id:
            payload.id ||
            (globalThis.crypto?.randomUUID?.() ??
              `${Date.now()}-${Math.random()}`),
          userId: payload.userId || payload.user?.id || userId || '',
          taskId: payload.taskId || payload.task?.id || '',
          type:
            (payload.type as Notification['type']) ||
            mapEventNameToType(eventName || (payload.event as string)),
          title:
            payload.title || payload.task?.title || 'Atualização de tarefa',
          message:
            payload.message || payload.content || 'Você tem uma atualização',
          isRead: false,
          createdAt: payload.createdAt || nowIso,
          updatedAt: nowIso,
        }
        setUnreadCount(prev => prev + 1)
        setNotifications(prev => [normalized, ...prev])
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        queryClient.invalidateQueries({ queryKey: ['task'] })
      } catch (e) {
        console.error('Erro ao processar notificação', e)
      }
    }

    newSocket.on('notification', (p: any) => handleIncoming(p, 'notification'))
    newSocket.on('comment:new', (p: any) => handleIncoming(p, 'comment:new'))
    newSocket.on('task:created', (p: any) => handleIncoming(p, 'task:created'))
    newSocket.on('task:updated', (p: any) => handleIncoming(p, 'task:updated'))
    newSocket.on('task:status', (p: any) => handleIncoming(p, 'task:status'))
    newSocket.on('task:assigned', (p: any) =>
      handleIncoming(p, 'task:assigned'),
    )
    newSocket.on('task_created', (p: any) => handleIncoming(p, 'task_created'))
    newSocket.on('task_updated', (p: any) => handleIncoming(p, 'task_updated'))
    newSocket.on('comment_created', (p: any) =>
      handleIncoming(p, 'comment_created'),
    )

    newSocket.on('notification_read', (evt: any) => {
      setNotifications(prev =>
        prev.map(n =>
          n.id === evt.notificationId ? { ...n, isRead: evt.isRead } : n,
        ),
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    })
    newSocket.on('notifications_read_all', () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    })

    newSocket.on('disconnect', () => {})

    newSocket.io.on('reconnect_error', err => {
      console.error('[ws] erro ao reconectar', err?.message)
    })

    newSocket.io.on('reconnect_failed', () => {
      console.error('[ws] reconexão falhou')
    })

    newSocket.on('connect_error', err => {
      console.error(
        'Erro de conexão com notificações em tempo real',
        err?.message,
      )
    })
    newSocket.on('error', err => {
      console.error('Erro no socket de notificações', err)
    })

    setSocket(newSocket)

    return () => {
      newSocket.off('notification')
      newSocket.off('comment:new')
      newSocket.off('task:created')
      newSocket.off('task:updated')
      newSocket.off('task:status')
      newSocket.off('task:assigned')
      newSocket.off('task_created')
      newSocket.off('task_updated')
      newSocket.off('comment_created')
      newSocket.off('notification_read')
      newSocket.off('notifications_read_all')
      newSocket.close()
    }
  }, [accessToken, queryClient, userId, wsBaseUrl])

  const {
    data: notificationsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => {
      return getNotifications({ limit: 5 })
    },
    enabled: true,
  })

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: (_, notificationId) => {
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n)),
      )
      setUnreadCount(prev => Math.max(0, prev - 1))

      queryClient.invalidateQueries({ queryKey: ['notifications'] })

      toast.success('Notificação marcada como lida')
    },
    onError: () => {
      console.error('Erro ao marcar notificação como lida')
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)

      queryClient.invalidateQueries({ queryKey: ['notifications'] })

      toast.success('Todas as notificações foram marcadas como lidas')
    },
    onError: () => {
      toast.error('Erro ao marcar todas as notificações como lidas')
    },
  })

  useEffect(() => {
    if (notificationsData?.data && Array.isArray(notificationsData.data)) {
      setNotifications(notificationsData.data)
      const unread = notificationsData.data.filter(n => !n.isRead).length
      setUnreadCount(unread)
    } else if (Array.isArray(notificationsData)) {
      setNotifications(notificationsData)
      const unread = notificationsData.filter(n => !n.isRead).length
      setUnreadCount(unread)
    } else {
    }
  }, [notificationsData])

  const markAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId)
  }

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate()
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    socket,
  }
}
