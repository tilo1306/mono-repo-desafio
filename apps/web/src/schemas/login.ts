import { REGEX_PASSWORD } from '@/constants/regex-password'
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres')
    .regex(
      REGEX_PASSWORD,
      'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial',
    ),
})

export type LoginFormData = z.infer<typeof loginSchema>
