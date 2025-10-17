import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import { TabelaSkeleton } from './-components/TabelaSkeleton'

import { getTasksPaginated } from '@/services/task'
import type { Task } from '@/services/task/type'
import { Priority, Status } from '@/utils/enums'

import { FilterTasks } from '@/components/filter-tasks'
import { ModalCreateTask } from '@/components/modal-create-task'
import { ModalUpdateTask } from '@/components/modal-update-task'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const Route = createFileRoute('/_app/dashboard/tabela/')({
  component: TabelaPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    size: Number(search.size) || 10,
    q: (search.q as string) || '',
    status: search.status as Status | undefined,
    priority: search.priority as Priority | undefined,
  }),
})

function TabelaPage() {
  const { page, size, q, status, priority } = Route.useSearch()
  const navigate = Route.useNavigate()

  const [isModalCreateTaskOpen, setIsModalCreateTaskOpen] = useState(false)
  const [isModalUpdateTaskOpen, setIsModalUpdateTaskOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const pagination = useMemo(
    () => ({
      page,
      size,
    }),
    [page, size],
  )

  const filters = useMemo(
    () => ({
      q,
      status,
      priority,
    }),
    [q, status, priority],
  )
  const { data, isLoading, error } = useQuery({
    queryKey: ['task', { ...pagination, ...filters }],
    queryFn: () => getTasksPaginated({ ...pagination, ...filters }),
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

  const getPriorityLabel = (priority: Priority) => {
    switch (priority) {
      case Priority.LOW:
        return 'Baixo'
      case Priority.MEDIUM:
        return 'Médio'
      case Priority.HIGH:
        return 'Alto'
      default:
        return priority
    }
  }

  const getPriorityVariant = (priority: Priority) => {
    switch (priority) {
      case Priority.LOW:
        return 'secondary'
      case Priority.MEDIUM:
        return 'default'
      case Priority.HIGH:
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getStatusVariant = (status: Status) => {
    switch (status) {
      case Status.TODO:
        return 'secondary'
      case Status.IN_PROGRESS:
        return 'default'
      case Status.REVIEW:
        return 'outline'
      case Status.DONE:
        return 'destructive'
      default:
        return 'default'
    }
  }

  const handlePageChange = (newPage: number) => {
    navigate({
      search: {
        page: newPage,
        size,
        q,
        status,
        priority,
      },
    })
  }

  const handleSizeChange = (newSize: number) => {
    navigate({
      search: {
        page: 1,
        size: newSize,
        q,
        status,
        priority,
      },
    })
  }

  const handleApplyFilters = (newFilters: {
    q: string
    status: Status | undefined
    priority: Priority | undefined
  }) => {
    navigate({
      search: {
        page: 1,
        size,
        q: newFilters.q,
        status: newFilters.status,
        priority: newFilters.priority,
      },
    })
  }

  const handleClearFilters = () => {
    navigate({
      search: {
        page: 1,
        size,
        q: '',
        status: undefined,
        priority: undefined,
      },
    })
  }

  const openModalUpdateTask = (task: Task) => {
    setSelectedTask(task)
    setIsModalUpdateTaskOpen(true)
  }

  if (isLoading) {
    return <TabelaSkeleton />
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-var(--header-height))] w-full min-w-0 flex-col p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Tabela de Tarefas</h1>
          <p className="text-muted-foreground">
            Visualize todas as tarefas em formato de tabela com paginação
          </p>
        </div>
        <div className="flex h-64 items-center justify-center">
          <p className="text-red-500">
            Erro ao carregar tarefas: {error.message}
          </p>
        </div>
      </div>
    )
  }

  const tasks = data?.data || []
  const totalPages = data?.totalPages || 0
  const currentPage = page
  const total = data?.total || 0

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--header-height))] w-full min-w-0 flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tabela de Tarefas</h1>
          <p className="text-muted-foreground">Visualize todas as tarefas</p>
        </div>
        <Button onClick={() => setIsModalCreateTaskOpen(true)}>
          Nova tarefa
        </Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Tarefas ({total} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map(task => (
                  <TableRow
                    key={task.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => openModalUpdateTask(task)}
                  >
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {task.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(task.status)}>
                        {getStatusLabel(task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityVariant(task.priority)}>
                        {getPriorityLabel(task.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.deadline
                        ? new Date(task.deadline).toLocaleDateString('pt-BR')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(task.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground text-sm">
                Mostrando {tasks.length} de {total} tarefas
              </p>
              <Select
                value={size.toString()}
                onValueChange={value => handleSizeChange(Number(value))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Itens por página" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 por página</SelectItem>
                  <SelectItem value="10">10 por página</SelectItem>
                  <SelectItem value="20">20 por página</SelectItem>
                  <SelectItem value="50">50 por página</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, currentPage - 2) + i
                  if (page > totalPages) return null

                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Próximo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ModalCreateTask
        isModalOpen={isModalCreateTaskOpen}
        setIsModalOpen={setIsModalCreateTaskOpen}
        status={Status.TODO}
      />

      <ModalUpdateTask
        isModalOpen={isModalUpdateTaskOpen}
        setIsModalOpen={setIsModalUpdateTaskOpen}
        task={selectedTask}
      />
    </div>
  )
}
