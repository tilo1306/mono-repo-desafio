import Prism from '@/components/Prism'
import { createFileRoute } from '@tanstack/react-router'
import { RegisterForm } from './-components/register-form'

export const Route = createFileRoute('/_auth/cadastro/')({
  component: RegisterPage,
  head: () => ({
    meta: [
      { name: 'title', content: 'Cadastro' },
      { name: 'description', content: 'Cadastro' },
    ],
  }),
})

function RegisterPage() {
  return (
    <div className="dark:bg-sidebar bg-secondary relative flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <Prism scale={3} />
      </div>

      <div className="relative z-20 w-full max-w-md space-y-8">
        <RegisterForm />
      </div>
    </div>
  )
}
