import { Badge } from '@/components/ui/badge'
import { useHealthContext } from './health-context'

export function HealthHeader() {
  const { lastUpdated } = useHealthContext()

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-card-foreground text-3xl font-bold">
          Health Dashboard
        </h1>
        <p className="text-muted-foreground">
          Monitoramento do status dos serviços
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-card-foreground text-sm font-medium">
            Todos os serviços operacionais
          </span>
        </div>

        <Badge variant="outline" className="text-xs">
          Última atualização:{' '}
          {lastUpdated
            ? lastUpdated.toLocaleTimeString('pt-BR')
            : 'Carregando...'}
        </Badge>
      </div>
    </div>
  )
}
