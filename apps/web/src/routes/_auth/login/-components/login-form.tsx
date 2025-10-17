import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import type { LoginFormData } from '@/schemas/login'
import { loginSchema } from '@/schemas/login'
import { login } from '@/services/auth/login'
import { getUserProfile } from '@/services/auth/profile'
import { useAuthStore } from '@/stores/token-store'
import { useUserStore } from '@/stores/user-store'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export function LoginForm() {
  const navigate = useNavigate()
  const { setTokens } = useAuthStore()
  const { setUser } = useUserStore()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async data => {
      toast.success('Login realizado com sucesso')
      setTokens(data.accessToken, data.refreshToken)
    },
    onError: error => {
      if (error instanceof AxiosError) {
        switch (error.response?.status) {
          case 401:
            toast.error('Email ou senha inválidos')
            break
          case 429:
            toast.error('Muitas requisições, tente novamente mais tarde')
            break
          default:
            toast.error('Algo deu errado, tente novamente mais tarde')
        }
      } else {
        toast.error('Algo deu errado, tente novamente mais tarde')
      }
    },
  })

  const profileMutation = useMutation({
    mutationFn: getUserProfile,
    onSuccess: data => {
      setUser(data)
      setTimeout(() => {
        navigate({ to: '/dashboard' })
      }, 2000)
    },
    onError: error => {
      if (error instanceof AxiosError) {
        switch (error.response?.status) {
          case 401:
            toast.error('Token inválido ou expirado')
            break
          case 404:
            toast.error('Usuário não encontrado')
            break
          case 429:
            toast.error('Muitas requisições, tente novamente mais tarde')
            break
          default:
            toast.error('Algo deu errado, tente novamente mais tarde')
        }
      } else {
        toast.error('Erro ao carregar perfil do usuário')
      }
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    const result = loginSchema.safeParse(data)
    if (!result.success) {
      return
    }
    const { email, password } = result.data

    try {
      await loginMutation.mutateAsync({
        email,
        password,
      })

      await new Promise(resolve => setTimeout(resolve, 200))

      await profileMutation.mutateAsync()
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Digite seu email abaixo para entrar em sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="joselito@gmail.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Senha</FieldLabel>
                </div>
                <PasswordInput id="password" {...register('password')} />
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
                </Button>
                <FieldDescription className="text-center">
                  Não tem uma conta?{' '}
                  <a href="/cadastro" className="underline">
                    Criar conta
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
