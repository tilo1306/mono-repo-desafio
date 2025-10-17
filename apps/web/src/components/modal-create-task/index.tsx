import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CreateTaskFormData } from '@/schemas/task'
import { createTaskSchema } from '@/schemas/task'
import { getUsers } from '@/services/auth/users'
import { createTask } from '@/services/task'
import { Priority, Status } from '@/utils/enums'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Plus, User, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { DialogFooter, DialogHeader } from '../ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select as UiSelect,
  SelectContent as UiSelectContent,
  SelectItem as UiSelectItem,
  SelectTrigger as UiSelectTrigger,
  SelectValue as UiSelectValue,
} from '../ui/select'
import { Textarea } from '../ui/textarea'

type Props = {
  isModalOpen: boolean
  setIsModalOpen: (isModalOpen: boolean) => void
  status?: Status
}

export function ModalCreateTask({
  isModalOpen,
  setIsModalOpen,
  status = Status.TODO,
}: Props) {
  const [selectedUsers, setSelectedUsers] = useState<
    Array<{ name: string; email: string; avatar: string }>
  >([])

  const form = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      deadline: '',
      priority: Priority.HIGH,
      status,
      assigneeEmails: '',
    },
  })

  useEffect(() => {
    form.setValue('status', status)
  }, [status, form])

  useEffect(() => {
    if (isModalOpen) {
      form.reset({
        title: '',
        description: '',
        deadline: '',
        priority: Priority.HIGH,
        status,
        assigneeEmails: '',
      })
      setSelectedUsers([])
    }
  }, [isModalOpen, form, status])

  const queryClient = useQueryClient()

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers({ limit: 100 }),
    enabled: isModalOpen,
  })

  const columns = useMemo(
    () => [Status.TODO, Status.IN_PROGRESS, Status.REVIEW, Status.DONE],
    [],
  )

  const addUser = (user: { name: string; email: string; avatar: string }) => {
    if (!selectedUsers.find(u => u.email === user.email)) {
      setSelectedUsers(prev => [...prev, user])
      updateAssigneeEmails([...selectedUsers, user])
    }
  }

  const removeUser = (userEmail: string) => {
    const newUsers = selectedUsers.filter(u => u.email !== userEmail)
    setSelectedUsers(newUsers)
    updateAssigneeEmails(newUsers)
  }

  const updateAssigneeEmails = (
    users: Array<{ name: string; email: string; avatar: string }>,
  ) => {
    const emails = users.map(u => u.email).join(', ')
    form.setValue('assigneeEmails', emails)
  }

  const addTask = useMutation({
    mutationFn: (data: CreateTaskFormData): Promise<any> => {
      const payload = {
        ...data,
        assigneeEmails: data.assigneeEmails
          ? data.assigneeEmails
              .split(',')
              .map(e => e.trim())
              .filter(Boolean)
          : [],
      }
      return createTask(payload)
    },
    onSuccess: () => {
      form.reset()
      setIsModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['task'] })
      toast.success('Tarefa criada com sucesso!')
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
            toast.error('Você não tem permissão para criar tarefas')
            break
          case 404:
            toast.error('Usuário não encontrado')
            break
          case 429:
            toast.error('Muitas requisições, tente novamente mais tarde')
            break
          default:
            toast.error('Algo deu errado, tente novamente mais tarde')
        }
        toast.error(error.response?.data.message)
      } else {
        toast.error('Erro ao criar tarefa')
      }
    },
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
  const onSubmit = (data: CreateTaskFormData) => {
    addTask.mutate(data)
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="mx-auto max-h-[90vh] max-w-full overflow-x-hidden overflow-y-auto sm:max-h-[85vh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova tarefa</DialogTitle>
          <DialogDescription>
            Crie uma nova tarefa para gerenciar o seu fluxo de trabalho.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="Digite o título"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Detalhes da tarefa"
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo (deadline)</Label>
              <Input
                id="deadline"
                type="datetime-local"
                {...form.register('deadline')}
              />
              {form.formState.errors.deadline && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.deadline.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <UiSelect
                value={form.watch('priority')}
                onValueChange={v => form.setValue('priority', v as Priority)}
              >
                <UiSelectTrigger className="w-full">
                  <UiSelectValue />
                </UiSelectTrigger>
                <UiSelectContent>
                  <UiSelectItem value="LOW">Baixo</UiSelectItem>
                  <UiSelectItem value="MEDIUM">Médio</UiSelectItem>
                  <UiSelectItem value="HIGH">Alto</UiSelectItem>
                </UiSelectContent>
              </UiSelect>
              {form.formState.errors.priority && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.priority.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignees">Responsáveis</Label>

            {selectedUsers.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <Badge
                    key={user.email}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{user.name.split(' ')[0]}</span>
                    <button
                      type="button"
                      onClick={() => removeUser(user.email)}
                      className="hover:bg-destructive hover:text-destructive-foreground ml-1 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar responsável
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-[60] max-h-60 w-full overflow-y-auto">
                {isLoadingUsers ? (
                  <DropdownMenuItem disabled>
                    <User className="mr-2 h-4 w-4" />
                    Carregando usuários...
                  </DropdownMenuItem>
                ) : usersData?.data?.length === 0 ? (
                  <DropdownMenuItem disabled>
                    <User className="mr-2 h-4 w-4" />
                    Nenhum usuário encontrado
                  </DropdownMenuItem>
                ) : (
                  usersData?.data?.map(user => {
                    const isSelected = selectedUsers.some(
                      u => u.email === user.email,
                    )

                    return (
                      <DropdownMenuItem
                        key={user.email}
                        onClick={() => !isSelected && addUser(user)}
                        disabled={isSelected}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="text-xs">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {user.name}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {user.email}
                          </span>
                        </div>
                        {isSelected && (
                          <Badge
                            variant="secondary"
                            className="ml-auto text-xs"
                          >
                            Selecionado
                          </Badge>
                        )}
                      </DropdownMenuItem>
                    )
                  })
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {form.formState.errors.assigneeEmails && (
              <p className="text-sm text-red-500">
                {form.formState.errors.assigneeEmails.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <UiSelect
              value={form.watch('status')}
              onValueChange={v => form.setValue('status', v as Status)}
            >
              <UiSelectTrigger className="w-full">
                <UiSelectValue />
              </UiSelectTrigger>
              <UiSelectContent>
                {columns.map(s => (
                  <UiSelectItem key={s} value={s}>
                    {getStatusLabel(s)}
                  </UiSelectItem>
                ))}
              </UiSelectContent>
            </UiSelect>
            {form.formState.errors.status && (
              <p className="text-sm text-red-500">
                {form.formState.errors.status.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addTask.isPending}>
              {addTask.isPending ? 'Criando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
