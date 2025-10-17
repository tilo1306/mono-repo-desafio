import { type CreateTaskFormData } from '@/schemas/task'
import { updateTask } from '@/services/task'
import type { Task } from '@/services/task/type'
import { Priority, Status } from '@/utils/enums'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Trash2 } from 'lucide-react'
import { type UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { DialogFooter } from '../ui/dialog'
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
import { AssigneesSelector } from './assignees-selector'

type Props = {
  task: Task
  form: UseFormReturn<CreateTaskFormData>
  onClose: () => void
  selectedUsers: Array<{
    id: string
    name: string
    email: string
    avatar: string
  }>
  setSelectedUsers: React.Dispatch<
    React.SetStateAction<
      Array<{ id: string; name: string; email: string; avatar: string }>
    >
  >
  usersData: any
  isLoadingUsers: boolean
  onDelete: () => void
}

export function DetailsForm({
  task,
  form,
  onClose,
  selectedUsers,
  setSelectedUsers,
  usersData,
  isLoadingUsers,
  onDelete,
}: Props) {
  const queryClient = useQueryClient()

  const updateTaskMutation = useMutation({
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
      return updateTask(task.id, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] })
      toast.success('Tarefa atualizada com sucesso!')
      onClose()
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
            toast.error('Você não tem permissão para editar tarefas')
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
        toast.error(error.response?.data.message)
      } else {
        toast.error('Erro ao atualizar tarefa')
      }
    },
  })

  const onSubmit = (data: CreateTaskFormData) => {
    updateTaskMutation.mutate(data)
  }

  const columns = [Status.TODO, Status.IN_PROGRESS, Status.REVIEW, Status.DONE]

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1"
    >
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          placeholder="Digite o título da tarefa"
          {...form.register('title')}
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
          placeholder="Digite a descrição da tarefa"
          {...form.register('description')}
          rows={4}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-red-500">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
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

        <div className="flex-1 space-y-2">
          <Label htmlFor="priority">Prioridade</Label>
          <UiSelect
            value={form.watch('priority')}
            onValueChange={v => form.setValue('priority', v as Priority)}
          >
            <UiSelectTrigger className="w-full">
              <UiSelectValue placeholder="Selecione a prioridade" />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectItem value={Priority.LOW}>Baixa</UiSelectItem>
              <UiSelectItem value={Priority.MEDIUM}>Média</UiSelectItem>
              <UiSelectItem value={Priority.HIGH}>Alta</UiSelectItem>
            </UiSelectContent>
          </UiSelect>
          {form.formState.errors.priority && (
            <p className="text-sm text-red-500">
              {form.formState.errors.priority.message}
            </p>
          )}
        </div>
      </div>

      <AssigneesSelector
        selectedUsers={selectedUsers}
        setSelectedUsers={setSelectedUsers}
        usersData={usersData}
        isLoadingUsers={isLoadingUsers}
        form={form}
      />

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <UiSelect
          value={form.watch('status')}
          onValueChange={v => form.setValue('status', v as Status)}
        >
          <UiSelectTrigger>
            <UiSelectValue placeholder="Selecione o status" />
          </UiSelectTrigger>
          <UiSelectContent>
            {columns.map(status => (
              <UiSelectItem key={status} value={status}>
                {status === Status.TODO && 'A Fazer'}
                {status === Status.IN_PROGRESS && 'Em Progresso'}
                {status === Status.REVIEW && 'Em Revisão'}
                {status === Status.DONE && 'Concluído'}
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

      <DialogFooter className="flex w-full flex-row items-center justify-between pt-4">
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Deletar
        </Button>
        <div className="ml-auto flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={updateTaskMutation.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={updateTaskMutation.isPending}>
            {updateTaskMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogFooter>
    </form>
  )
}
