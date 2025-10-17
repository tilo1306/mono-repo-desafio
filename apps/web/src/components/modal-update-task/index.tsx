import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CreateTaskFormData } from '@/schemas/task'
import { createTaskSchema } from '@/schemas/task'
import { getUsers } from '@/services/auth/users'
import { getTaskComments } from '@/services/task/comments'
import type { Task } from '@/services/task/type'
import { Priority, Status } from '@/utils/enums'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { DialogHeader } from '../ui/dialog'
import { CommentsSection } from './comments-section'
import { DeleteModal } from './delete-modal'
import { DetailsForm } from './details-form'

type Props = {
  isModalOpen: boolean
  setIsModalOpen: (isModalOpen: boolean) => void
  task: Task | null
}

export function ModalUpdateTask({ isModalOpen, setIsModalOpen, task }: Props) {
  const [selectedUsers, setSelectedUsers] = useState<
    Array<{ id: string; name: string; email: string; avatar: string }>
  >([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details')

  const form = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      deadline: '',
      priority: Priority.HIGH,
      status: Status.TODO,
      assigneeEmails: '',
    },
  })

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        deadline: task.deadline
          ? new Date(task.deadline).toISOString().slice(0, 16)
          : '',
        priority: task.priority,
        status: task.status,
        assigneeEmails: '',
      })
    }
  }, [task, form])

  useEffect(() => {
    if (!isModalOpen) {
      setSelectedUsers([])
    }
  }, [isModalOpen])

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers({ limit: 100 }),
    enabled: isModalOpen,
  })

  useEffect(() => {
    if (task && usersData?.data) {
      if (task.assignees?.length > 0) {
        const realUsers = task.assignees.map(assignee => {
          const fullUser = usersData.data.find(
            u => u.email === assignee.user.email,
          )

          return {
            id: assignee.userId,
            name: assignee.user.name,
            email: assignee.user.email,
            avatar:
              fullUser?.avatar || `https://robohash.org/${assignee.userId}`,
          }
        })

        setSelectedUsers(realUsers)

        const emails = realUsers.map(u => u.email).join(', ')
        form.setValue('assigneeEmails', emails)
      } else {
        setSelectedUsers([])
        form.setValue('assigneeEmails', '')
      }
    }
  }, [task, usersData, form])

  const { data: commentsData, isLoading: isLoadingComments } = useQuery({
    queryKey: ['task-comments', task?.id],
    queryFn: () => getTaskComments(task!.id, { page: 1, size: 50 }),
    enabled: isModalOpen && !!task?.id,
  })

  if (!task) return null

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="flex max-h-[90vh] min-h-[600px] w-[95vw] max-w-full flex-col overflow-hidden overflow-x-hidden p-5 sm:max-h-[85vh]">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Tarefa</DialogTitle>
                <DialogDescription>
                  Veja detalhes da tarefa e edite as informações se necessário
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={v => setActiveTab(v as 'details' | 'comments')}
            className="flex min-h-0 w-full flex-1 flex-col"
          >
            <TabsList className="grid w-full flex-shrink-0 grid-cols-2 rounded-md border">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="comments">Comentários</TabsTrigger>
            </TabsList>

            <TabsContent
              value="details"
              className="flex min-h-0 flex-1 flex-col gap-4"
            >
              <DetailsForm
                task={task}
                form={form}
                onClose={() => setIsModalOpen(false)}
                selectedUsers={selectedUsers}
                setSelectedUsers={setSelectedUsers}
                usersData={usersData}
                isLoadingUsers={isLoadingUsers}
                onDelete={() => setShowDeleteModal(true)}
              />
            </TabsContent>

            <TabsContent
              value="comments"
              className="flex min-h-0 flex-1 flex-col gap-4"
            >
              <CommentsSection
                taskId={task.id}
                commentsData={commentsData}
                isLoadingComments={isLoadingComments}
                activeTab={activeTab}
                isModalOpen={isModalOpen}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        taskId={task.id}
        onSuccess={() => setIsModalOpen(false)}
      />
    </>
  )
}
