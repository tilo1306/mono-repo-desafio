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
import { registerSchema, type RegisterFormData } from '@/schemas/register'
import { register } from '@/services/auth/register'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export function RegisterForm() {
  const navigate = useNavigate()

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      toast.success('Conta criada com sucesso')
      setTimeout(() => {
        navigate({ to: '/login' })
      }, 2000)
    },
    onError: error => {
      if (error instanceof AxiosError) {
        switch (error.response?.status) {
          case 400:
            toast.error('Campos inválidos')
            break
          case 409:
            toast.error('Usuário já cadastrado')
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

  const onSubmit = async (data: RegisterFormData) => {
    const result = registerSchema.safeParse(data)
    if (result.success) {
      await registerMutation.mutateAsync(result.data)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Crie sua conta</CardTitle>
          <CardDescription>
            Digite suas informações abaixo para criar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nome completo</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="João da Silva"
                  {...registerField('name')}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@gmail.com"
                  {...registerField('email')}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <PasswordInput id="password" {...registerField('password')} />
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  Confirmar senha
                </FieldLabel>
                <PasswordInput
                  id="confirmPassword"
                  {...registerField('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </Field>
              <Field>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="acceptPolicy"
                    {...registerField('acceptPolicy')}
                    className="h-4 w-4"
                  />
                  <FieldLabel htmlFor="acceptPolicy" className="text-sm">
                    Aceito a{' '}
                    <a href="#" className="underline">
                      Política de privacidade
                    </a>
                  </FieldLabel>
                </div>
                {errors.acceptPolicy && (
                  <p className="text-sm text-red-500">
                    {errors.acceptPolicy.message}
                  </p>
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={registerMutation.isPending}>
                  {registerMutation.isPending
                    ? 'Criando conta...'
                    : 'Criar conta'}
                </Button>
                <FieldDescription className="text-center">
                  Já tem uma conta?{' '}
                  <a href="/login" className="underline">
                    Entrar
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
