import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function TabelaSkeleton() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--header-height))] w-full min-w-0 flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
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
                {Array.from({ length: 10 }, (_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-8 w-32" />
            </div>

            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-8 w-8" />
                ))}
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
