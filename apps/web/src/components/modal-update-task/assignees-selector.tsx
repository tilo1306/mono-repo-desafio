import { type CreateTaskFormData } from '@/schemas/task'
import { Plus, User, X } from 'lucide-react'
import { type UseFormReturn } from 'react-hook-form'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Label } from '../ui/label'

type Props = {
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
  form: UseFormReturn<CreateTaskFormData>
}

export function AssigneesSelector({
  selectedUsers,
  setSelectedUsers,
  usersData,
  isLoadingUsers,
  form,
}: Props) {
  const addUser = (user: {
    id: string
    name: string
    email: string
    avatar: string
  }) => {
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
    users: Array<{ id: string; name: string; email: string; avatar: string }>,
  ) => {
    const emails = users.map(u => u.email).join(', ')
    form.setValue('assigneeEmails', emails)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="assignees">Responsáveis</Label>

      {selectedUsers.length > 0 && (
        <div className="mb-2 flex max-h-32 flex-wrap gap-2 overflow-y-auto pr-1">
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
            usersData?.data?.map((user: any) => {
              const isSelected = selectedUsers.some(u => u.email === user.email)

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
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {user.email}
                    </span>
                  </div>
                  {isSelected && (
                    <Badge variant="secondary" className="ml-auto text-xs">
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
  )
}
