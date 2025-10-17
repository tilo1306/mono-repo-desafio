import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Priority, Status } from '@/utils/enums'
import { useState } from 'react'

interface FilterTasksProps {
  onApplyFilters: (filters: {
    q: string
    status: Status | undefined
    priority: Priority | undefined
  }) => void
  onClearFilters: () => void
  initialFilters?: {
    q: string
    status: Status | undefined
    priority: Priority | undefined
  }
}

export function FilterTasks({
  onApplyFilters,
  onClearFilters,
  initialFilters,
}: FilterTasksProps) {
  const [q, setQ] = useState(initialFilters?.q || '')
  const [statusFilter, setStatusFilter] = useState<Status | undefined>(
    initialFilters?.status,
  )
  const [priorityFilter, setPriorityFilter] = useState<Priority | undefined>(
    initialFilters?.priority,
  )

  const handleApplyFilters = () => {
    onApplyFilters({
      q,
      status: statusFilter,
      priority: priorityFilter,
    })
  }

  const handleClearFilters = () => {
    setQ('')
    setStatusFilter(undefined)
    setPriorityFilter(undefined)
    onClearFilters()
  }

  return (
    <div className="mb-4 flex flex-wrap gap-4 sm:flex-row">
      <div className="space-y-1">
        <Label htmlFor="search">Buscar</Label>
        <Input
          id="search"
          placeholder="Buscar por título ou descrição"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="status">Status</Label>
        <Select
          value={statusFilter}
          onValueChange={value => setStatusFilter(value as Status)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={Status.TODO}>A Fazer</SelectItem>
            <SelectItem value={Status.IN_PROGRESS}>Em Progresso</SelectItem>
            <SelectItem value={Status.REVIEW}>Revisão</SelectItem>
            <SelectItem value={Status.DONE}>Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="priority">Prioridade</Label>
        <Select
          value={priorityFilter}
          onValueChange={value => setPriorityFilter(value as Priority)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas as prioridades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={Priority.LOW}>Baixa</SelectItem>
            <SelectItem value={Priority.MEDIUM}>Média</SelectItem>
            <SelectItem value={Priority.HIGH}>Alta</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-20 items-end">
        <Button onClick={handleApplyFilters} size="sm" className="w-full">
          Filtrar
        </Button>
      </div>
      <div className="flex w-20 items-end">
        <Button
          onClick={handleClearFilters}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Limpar
        </Button>
      </div>
    </div>
  )
}
