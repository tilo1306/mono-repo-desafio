import { REGEX_PASSWORD } from '@/constants/regex-password'
import { z } from 'zod'

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres')
      .refine(value => value.trim().split(' ').length >= 2, {
        message: 'Digite seu nome completo',
      }),
    email: z.string().email('Email inválido'),
    password: z
      .string()
      .min(6, 'Senha deve ter pelo menos 6 caracteres')
      .max(100, 'Senha deve ter no máximo 100 caracteres')
      .regex(
        REGEX_PASSWORD,
        'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial',
      ),
    confirmPassword: z.string(),
    acceptPolicy: z.boolean().refine(val => val === true, {
      message: 'Você deve aceitar a política de privacidade',
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
  })

export type RegisterFormData = z.infer<typeof registerSchema>
