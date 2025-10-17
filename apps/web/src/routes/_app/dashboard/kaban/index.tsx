import { FilterTasks } from '@/components/filter-tasks'
import { ModalCreateTask } from '@/components/modal-create-task'
import { ModalUpdateTask } from '@/components/modal-update-task'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useIsMobile } from '@/hooks/use-mobile'
import { getTasksPaginated, updateTaskStatus } from '@/services/task'
import type { Task } from '@/services/task/type'
import { Priority, Status } from '@/utils/enums'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/dashboard/kaban/')({
  component: KabanPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || '',
    status: search.status as Status | undefined,
    priority: search.priority as Priority | undefined,
  }),
})

function KabanPage() {
  const { q, status, priority } = Route.useSearch()
  const navigate = Route.useNavigate()

  const [isModalCreateTaskOpen, setIsModalCreateTaskOpen] = useState(false)
  const [isModalUpdateTaskOpen, setIsModalUpdateTaskOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)

  const filters = useMemo(
    () => ({
      q,
      status,
      priority,
    }),
    [q, status, priority],
  )

  const [newStatus, setNewStatus] = useState<Status>(Status.TODO)
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const isPanningRef = useRef(false)
  const panStartXRef = useRef(0)
  const panScrollLeftRef = useRef(0)
  const [, setIsPanning] = useState(false)

  const {
    data: tasksData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['task', 100, filters],
    queryFn: () =>
      getTasksPaginated({
        size: 100,
        ...filters,
      }),
  })

  const getStatusLabel = (status: Status) => {
    switch (status) {
      case Status.TODO:
        return 'A Fazer'
      case Status.IN_PROGRESS:
        return 'Em Progresso'
      case Status.REVIEW:
        return 'Revisão'
      case Status.DONE:
        return 'Concluído'
      default:
        return status
    }
  }

  const tasks = Array.isArray(tasksData?.data) ? tasksData.data : []

  const columns = useMemo(
    () => [Status.TODO, Status.IN_PROGRESS, Status.REVIEW, Status.DONE],
    [],
  )

  const grouped = useMemo(() => {
    return columns.reduce<Record<Status, Task[]>>(
      (acc, col) => {
        acc[col] = (tasks || []).filter((t: Task) => t.status === col)
        return acc
      },
      {} as Record<Status, Task[]>,
    )
  }, [tasks, columns])

  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: Status }) =>
      updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] })

      toast.success('Tarefa movida com sucesso!')
    },
    onError: error => {
      if (error instanceof AxiosError) {
        switch (error.response?.status) {
          case 400:
            toast.error('Campos inválidos')
            break
          case 401:
            console.log('Token inválido ou expirado')
            break
          case 403:
            toast.error('Você não tem permissão para mover tarefas')
            break
          case 404:
            toast.error('Tarefa não encontrada')
            break
          case 429:
            toast.error('Muitas requisições, tente novamente mais tarde')
            break
          default:
            toast.error('Algo deu errado, tente novamente mais tarde')
        }
      }
      toast.error('Erro ao mover tarefa')
    },
  })

  const moveTask = (taskId: string, to: Status) => {
    moveTaskMutation.mutate({ taskId, status: to })
  }

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    taskId: string,
  ) => {
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, to: Status) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId) moveTask(taskId, to)
  }

  const beginPan = (clientX: number, target: EventTarget | null) => {
    const scroller = scrollerRef.current
    if (!scroller) return

    if (
      target &&
      target instanceof HTMLElement &&
      target.closest('[draggable="true"]')
    ) {
      return
    }
    isPanningRef.current = true
    setIsPanning(true)
    panStartXRef.current = clientX
    panScrollLeftRef.current = scroller.scrollLeft
  }

  const updatePan = (clientX: number) => {
    if (!isPanningRef.current) return
    const scroller = scrollerRef.current
    if (!scroller) return
    const deltaX = clientX - panStartXRef.current
    scroller.scrollLeft = panScrollLeftRef.current - deltaX
  }

  const endPan = () => {
    if (!isPanningRef.current) return
    isPanningRef.current = false
    setIsPanning(false)
  }

  const openModalCreateTask = (status: Status) => {
    setIsModalCreateTaskOpen(true)
    setNewStatus(status)
  }

  const openModalUpdateTask = (task: any) => {
    setSelectedTask(task)
    setIsModalUpdateTaskOpen(true)
  }

  const handleApplyFilters = (newFilters: {
    q: string
    status: Status | undefined
    priority: Priority | undefined
  }) => {
    navigate({
      search: {
        q: newFilters.q,
        status: newFilters.status,
        priority: newFilters.priority,
      },
    })
  }

  const handleClearFilters = () => {
    navigate({
      search: {
        q: '',
        status: undefined,
        priority: undefined,
      },
    })
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-var(--header-height))] w-full min-w-0 flex-col p-6">
        <div className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 mb-4 flex items-center justify-between py-2 backdrop-blur">
          <h1 className="text-2xl font-bold">Quadro de Tarefas</h1>
          <div className="flex-shrink-0 whitespace-nowrap">
            <Button onClick={() => openModalCreateTask(Status.TODO)}>
              Nova tarefa
            </Button>
          </div>
        </div>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Carregando tarefas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-var(--header-height))] w-full min-w-0 flex-col p-6">
        <div className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 mb-4 flex items-center justify-between py-2 backdrop-blur">
          <h1 className="text-2xl font-bold">Quadro de Tarefas</h1>
          <div className="flex-shrink-0 whitespace-nowrap">
            <Button onClick={() => openModalCreateTask(Status.TODO)}>
              Nova tarefa
            </Button>
          </div>
        </div>
        <div className="flex h-64 items-center justify-center">
          <p className="text-red-500">
            Erro ao carregar tarefas: {error.message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto flex min-h-[calc(100vh-var(--header-height))] w-full min-w-0 flex-col sm:p-6">
        <div className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 mb-4 flex items-center justify-between py-2 backdrop-blur">
          <h1 className="text-2xl font-bold">Quadro de Tarefas</h1>
          <div className="flex-shrink-0 whitespace-nowrap">
            <Button onClick={() => openModalCreateTask(Status.TODO)}>
              Nova tarefa
            </Button>
          </div>
        </div>

        <FilterTasks
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          initialFilters={{
            q,
            status,
            priority,
          }}
        />

        <div
          ref={scrollerRef}
          className="no-scrollbar flex h-full max-w-full gap-4 overflow-x-auto pb-4"
          onMouseDown={e => {
            if (e.button !== 0) return
            beginPan(e.clientX, e.target)
          }}
          onMouseMove={e => {
            if (!isPanningRef.current) return
            e.preventDefault()
            updatePan(e.clientX)
          }}
          onMouseLeave={() => endPan()}
          onMouseUp={() => endPan()}
          onTouchStart={e => {
            if (e.touches.length !== 1) return
            const t = e.touches[0]
            beginPan(t.clientX, e.target)
          }}
          onTouchMove={e => {
            if (!isPanningRef.current) return
            if (e.touches.length !== 1) return
            e.preventDefault()
            const t = e.touches[0]
            updatePan(t.clientX)
          }}
          onTouchEnd={() => endPan()}
          onTouchCancel={() => endPan()}
        >
          {columns.map(col => (
            <Card
              key={col}
              className={`m-2 ${isMobile ? 'w-80' : 'w-96'} flex-shrink-0`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    {getStatusLabel(col)}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openModalCreateTask(col)}
                    className="flex-shrink-0 whitespace-nowrap"
                  >
                    + Adicionar
                  </Button>
                </div>
                <Separator className="mt-2" />
              </CardHeader>
              <CardContent>
                <div
                  className="0 max-h-[60vh] min-h-40 space-y-2 overflow-y-auto"
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, col)}
                >
                  {grouped[col].map(task => (
                    <Card
                      key={task.id}
                      className="hover:bg-accent/50 m-4 cursor-pointer transition-colors"
                      draggable
                      onDragStart={e => handleDragStart(e, task.id)}
                      onClick={() => openModalUpdateTask(task)}
                    >
                      <CardContent className="min-w-0 p-3">
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-muted-foreground mt-1 truncate text-sm">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {grouped[col].length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      Nenhuma tarefa
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <ModalCreateTask
        isModalOpen={isModalCreateTaskOpen}
        setIsModalOpen={setIsModalCreateTaskOpen}
        status={newStatus}
      />

      <ModalUpdateTask
        isModalOpen={isModalUpdateTaskOpen}
        setIsModalOpen={setIsModalUpdateTaskOpen}
        task={selectedTask}
      />
    </>
  )
}
