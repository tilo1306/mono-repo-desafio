import { Badge } from '@/components/ui/badge'
import { BorderBeam } from '@/components/ui/border-beam'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Feature } from '@/routes/_auth/-components/feature'
import { MiniCard } from '@/routes/_auth/-components/mini-card'
import { useAuthStore } from '@/stores/token-store'
import { Separator } from '@radix-ui/react-separator'
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import {
  BookOpenText,
  Boxes,
  CheckCircle2,
  MessageSquare,
  Shield,
  Terminal,
  Zap,
} from 'lucide-react'
import { useEffect } from 'react'

export const Route = createFileRoute('/_auth/')({
  component: HomePage,
  beforeLoad: async () => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken) {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
  head: () => ({
    meta: [
      { name: 'title', content: 'Desafio Full-stack Júnior' },
      { name: 'description', content: 'Desafio Full-stack Júnior' },
    ],
  }),
})

const listFeatures = [
  {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: 'CRUD de Tarefas',
    text: 'Título, descrição, prazo, prioridade e status.',
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: 'Comentários & Histórico',
    text: 'Colaboração com comentários e audit log.',
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Notificações em tempo real',
    text: 'Eventos via RabbitMQ entregues por WebSocket.',
  },
]

function HomePage() {
  const navigate = useNavigate()
  const { accessToken } = useAuthStore()

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated() && accessToken) {
      navigate({ to: '/dashboard', replace: true })
    }
  }, [accessToken, navigate])

  return (
    <div className="from-background via-background to-muted text-foreground min-h-screen overflow-x-hidden bg-gradient-to-b">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-primary/30 absolute -top-40 -left-40 h-96 w-96 rounded-full blur-3xl" />
        <div className="bg-accent/20 absolute -right-40 -bottom-40 h-96 w-96 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-4 py-10">
          <Card className="border-border/50 bg-card/50 backdrop-blur-md">
            <BorderBeam
              size={60}
              duration={8}
              delay={0}
              colorFrom="#06b6d4"
              colorTo="#2563eb"
            />
            <CardContent className="p-4 sm:p-8">
              <div className="grid gap-8 sm:grid-cols-2 sm:items-center">
                <div>
                  <h1 className="text-3xl leading-tight font-bold sm:text-4xl">
                    Desafio Full-stack Júnior
                  </h1>
                  <p className="text-muted-foreground mt-2 text-xl">
                    Sistema de Gestão de Tarefas Colaborativo
                  </p>
                  <p className="text-muted-foreground mt-4">
                    Monorepo com microsserviços Nest, mensageria via RabbitMQ e
                    UI em React + TanStack Router.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link to="/dashboard">
                      <Button
                        size="lg"
                        className="bg-primary hover:bg-primary/90"
                      >
                        Dashboard
                      </Button>
                    </Link>
                    <a
                      href={`${import.meta.env.VITE_BACK_END}/api/docs`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button
                        size="lg"
                        variant="ghost"
                        className="hover:bg-accent gap-2"
                      >
                        <BookOpenText className="h-4 w-4" /> API Docs
                      </Button>
                    </a>
                  </div>

                  <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-2 text-sm">
                    <Shield className="h-4 w-4" />
                    <span>JWT, validação e rate-limit no Gateway</span>
                  </div>
                </div>

                <div className="grid gap-4 sm:gap-5">
                  {listFeatures.map(feature => (
                    <Feature key={feature.title} {...feature} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-8 sm:pb-12">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <BorderBeam
              size={60}
              duration={8}
              delay={0}
              colorFrom="#06b6d4"
              colorTo="#2563eb"
            />
            <CardHeader>
              <CardTitle className="text-2xl">Sobre o projeto</CardTitle>
            </CardHeader>
            <Separator className="bg-border" />
            <CardContent className="space-y-6">
              <p className="text-foreground">
                Este repositório contém a minha implementação do{' '}
                <strong>Desafio Full-stack Júnior</strong> da Jungle Gaming. O
                foco foi estruturar um <strong>monorepo</strong>, modelar um
                domínio simples de tarefas e integrar serviços por{' '}
                <strong>RabbitMQ</strong>, oferecendo uma UI limpa e responsiva.
              </p>

              <div>
                <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
                  Stack utilizada
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge className="focus:ring-ring bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    React + TanStack Router
                  </Badge>
                  <Badge className="focus:ring-ring bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    shadcn/ui
                  </Badge>
                  <Badge className="focus:ring-ring bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    Tailwind CSS
                  </Badge>
                  <Badge className="focus:ring-ring bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    Framer Motion
                  </Badge>
                  <Badge className="focus:ring-ring bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    TanStack Query
                  </Badge>
                  <Badge className="focus:ring-ring bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    Magic UI
                  </Badge>
                  <Badge className="focus:ring-ring bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    Zod
                  </Badge>
                  <Badge className="focus:ring-ring bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    Axios
                  </Badge>
                  <Badge className="focus:ring-ring bg-primary text-primary-foreground hover:bg-primary/80">
                    Nest.js
                  </Badge>
                  <Badge className="focus:ring-ring bg-primary text-primary-foreground hover:bg-primary/80">
                    TypeORM + PostgreSQL
                  </Badge>
                  <Badge className="focus:ring-ring bg-primary text-primary-foreground hover:bg-primary/80">
                    RabbitMQ
                  </Badge>
                  <Badge className="focus:ring-ring bg-primary text-primary-foreground hover:bg-primary/80">
                    Docker & Compose
                  </Badge>
                  <Badge className="focus:ring-ring bg-primary text-primary-foreground hover:bg-primary/80">
                    Turborepo
                  </Badge>
                  <Badge className="focus:ring-ring bg-primary text-primary-foreground hover:bg-primary/80">
                    Jest
                  </Badge>
                  <Badge className="focus:ring-ring bg-primary text-primary-foreground hover:bg-primary/80">
                    Swagger
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <MiniCard
                  title="Objetivo"
                  text="Autenticação, tarefas colaborativas, comentários, atribuições e notificações em tempo real."
                  icon={<Boxes className="h-4 w-4" />}
                />
                <MiniCard
                  title="Critérios que foquei"
                  text="Organização do código, segurança básica, separação entre serviços e DX."
                  icon={<Shield className="h-4 w-4" />}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/health">
                  <Button
                    variant="outline"
                    className="border-border hover:bg-accent gap-2 bg-transparent"
                  >
                    <Terminal className="h-4 w-4" /> Healthcheck
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-border relative z-10 border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm">
          <span>© {new Date().getFullYear()} — Projeto de avaliação</span>
          <span>React • shadcn/ui • Tailwind</span>
        </div>
      </footer>
    </div>
  )
}
