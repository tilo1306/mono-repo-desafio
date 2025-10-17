import { Badge } from '@/components/ui/badge'
import { BorderBeam } from '@/components/ui/border-beam'
import { Card } from '@/components/ui/card'
import { getHealth } from '@/services/health'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Database,
  Server,
  Shield,
} from 'lucide-react'
import { useEffect } from 'react'
import { useHealthContext } from './health-context'

export function HealthContent() {
  const { setLastUpdated } = useHealthContext()
  const { data, isFetching } = useSuspenseQuery({
    queryKey: ['health'],
    queryFn: () => getHealth(),
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  })

  useEffect(() => {
    const now = new Date()
    setLastUpdated(now)
  }, [isFetching])

  const serviceIcons = {
    auth_service: Shield,
    tasks_service: Database,
    notifications_service: Activity,
  }

  const serviceNames = {
    auth_service: 'Auth Service',
    tasks_service: 'Tasks Service',
    notifications_service: 'Notifications Service',
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'down':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getOverallStatus = () => {
    if (!data) return 'ok'
    if (data.status === 'error') return 'error'
    if (data.status === 'warning') return 'warning'
    return 'ok'
  }

  const overallStatus = getOverallStatus()

  return (
    <>
      <Card className="relative overflow-hidden p-6">
        <BorderBeam
          size={80}
          duration={12}
          delay={0}
          colorFrom={
            overallStatus === 'ok'
              ? '#10b981'
              : overallStatus === 'warning'
                ? '#f59e0b'
                : '#ef4444'
          }
          colorTo={
            overallStatus === 'ok'
              ? '#059669'
              : overallStatus === 'warning'
                ? '#d97706'
                : '#dc2626'
          }
        />

        <div className="flex flex-col items-center justify-between sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
              <Server className="text-primary h-6 w-6" />
            </div>
            <div>
              <h2 className="text-card-foreground text-xl font-semibold">
                Status Geral do Sistema
                {isFetching && (
                  <span className="text-muted-foreground ml-2 text-sm">
                    (Atualizando...)
                  </span>
                )}
              </h2>
              <p className="text-muted-foreground">
                {`${Object.keys(data?.details || {}).length} serviços monitorados`}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-2">
              {getStatusIcon(
                overallStatus === 'ok'
                  ? 'up'
                  : overallStatus === 'warning'
                    ? 'degraded'
                    : 'down',
              )}
              <span className="text-card-foreground text-2xl font-bold">
                {overallStatus === 'ok'
                  ? 'HEALTHY'
                  : overallStatus === 'warning'
                    ? 'DEGRADED'
                    : 'UNHEALTHY'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data &&
          Object.entries(data?.details || {}).map(([service, status]) => {
            const IconComponent =
              serviceIcons[service as keyof typeof serviceIcons]
            const serviceName =
              serviceNames[service as keyof typeof serviceNames]

            return (
              <Card key={service} className="relative overflow-hidden p-6">
                <BorderBeam
                  size={60}
                  duration={8}
                  delay={Math.random() * 2}
                  colorFrom={
                    status === 'up'
                      ? '#10b981'
                      : status === 'degraded'
                        ? '#f59e0b'
                        : '#ef4444'
                  }
                  colorTo={
                    status === 'up'
                      ? '#059669'
                      : status === 'degraded'
                        ? '#d97706'
                        : '#dc2626'
                  }
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                        <IconComponent className="text-primary h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-card-foreground font-semibold">
                          {serviceName}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {service}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <Badge
                        variant={
                          status === 'up'
                            ? 'default'
                            : status === 'degraded'
                              ? 'secondary'
                              : 'destructive'
                        }
                        className="text-xs"
                      >
                        {status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="text-card-foreground font-medium">
                        {status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Última verificação:
                      </span>
                      <span className="text-card-foreground font-medium">
                        {new Date().toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted h-2 w-full rounded-full">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        status === 'up'
                          ? 'bg-green-500'
                          : status === 'degraded'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{
                        width:
                          status === 'up'
                            ? '100%'
                            : status === 'degraded'
                              ? '70%'
                              : '0%',
                      }}
                    />
                  </div>
                </div>
              </Card>
            )
          })}
      </div>
    </>
  )
}
