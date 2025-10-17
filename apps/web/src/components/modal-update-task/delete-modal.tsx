import { deleteTask } from '@/services/task'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'

type Props = {
  isOpen: boolean
  onClose: () => void
  taskId: string
  onSuccess: () => void
}

export function DeleteModal({ isOpen, onClose, taskId, onSuccess }: Props) {
  const queryClient = useQueryClient()

  const deleteTaskMutation = useMutation({
    mutationFn: () => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] })
      toast.success('Tarefa deletada com sucesso!')
      onSuccess()
      onClose()
    },
    onError: error => {
      if (error instanceof AxiosError) {
        switch (error.response?.status) {
          case 401:
            console.log('Token inválido ou expirado')
            break
          case 403:
            toast.error('Você não tem permissão para deletar tarefas')
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
        toast.error('Erro ao deletar tarefa')
      }
    },
  })

  const handleDelete = () => {
    deleteTaskMutation.mutate()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="mx-auto max-h-[90vh] overflow-y-auto sm:max-h-[85vh] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar exclusão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja deletar esta tarefa? Esta ação não pode ser
            desfeita.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteTaskMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteTaskMutation.isPending}
          >
            {deleteTaskMutation.isPending ? 'Deletando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
