import ProfileCard from '@/components/ProfileCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getUsers } from '@/services/auth/users'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Search, Users } from 'lucide-react'
import { useState } from 'react'
import { UsersSkeleton } from './-components/UsersSkeleton'

export const Route = createFileRoute('/_app/dashboard/usuarios/')({
  component: UsersPage,
})

function UsersPage() {
  const [page, setPage] = useState(1)
  const [emailFilter, setEmailFilter] = useState('')
  const [searchName, setSearchName] = useState('')
  const limit = 12

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page, searchName],
    queryFn: () => getUsers({ page, limit, email: searchName }),
  })

  const handleSearch = () => {
    setSearchName(emailFilter)
    setPage(1)
  }

  const handleClearFilter = () => {
    setEmailFilter('')
    setSearchName('')
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const getRandomStatus = () => {
    const statuses = ['Online', 'Offline', 'Away'] as const
    return statuses[Math.floor(Math.random() * statuses.length)]
  }

  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
          <Users className="text-primary h-5 w-5" />
        </div>
        <div>
          <h1 className="text-foreground text-2xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie e visualize todos os usuários do sistema
          </p>
        </div>
      </div>

      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label
            htmlFor="name-filter"
            className="text-foreground text-sm font-medium"
          >
            Filtrar por e-mail
          </label>
          <div className="mt-1 flex max-w-sm gap-2">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                id="name-filter"
                placeholder="Digite o e-mail do usuário..."
                value={emailFilter}
                onChange={e => setEmailFilter(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              Filtrar
            </Button>
            {searchName && (
              <Button variant="outline" onClick={handleClearFilter}>
                Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      {data && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {searchName ? `Filtrado por: "${searchName}"` : 'Todos os usuários'}{' '}
            - Página {data.meta.page} de {data.meta.totalPages}(
            {data.meta.total} usuários)
          </p>
        </div>
      )}

      {error && (
        <div className="py-8 text-center">
          <p className="text-destructive">Erro ao carregar usuários</p>
        </div>
      )}

      {isLoading && <UsersSkeleton />}

      {data && !isLoading && data.data && (
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-1 flex-wrap justify-center gap-6 overflow-y-auto p-4">
            {data.data.map((user: any, index: number) => (
              <div key={index} className="w-auto flex-shrink-0">
                <ProfileCard
                  name={user.name.split(' ')[0]}
                  title="Software Engineer"
                  handle={user.email.split('@')[0]}
                  status={getRandomStatus()}
                  avatarUrl={user.avatar}
                  showUserInfo={false}
                  enableTilt={true}
                  enableMobileTilt={false}
                />
              </div>
            ))}
          </div>

          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(page - 1)}
                disabled={!data.meta.hasPrev || isLoading}
              >
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from(
                  { length: Math.min(5, data.meta.totalPages) },
                  (_, i) => {
                    const pageNum =
                      Math.max(
                        1,
                        Math.min(data.meta.totalPages - 4, page - 2),
                      ) + i
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isLoading}
                      >
                        {pageNum}
                      </Button>
                    )
                  },
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => handlePageChange(page + 1)}
                disabled={!data.meta.hasNext || isLoading}
              >
                Próximo
              </Button>
            </div>
          )}

          {data.data.length === 0 && (
            <div className="py-8 text-center">
              <Users className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground">
                {searchName
                  ? 'Nenhum usuário encontrado com esse nome'
                  : 'Nenhum usuário encontrado'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
