import { REGEX_PASSWORD } from '@/constants/regex-password'
import { z } from 'zod'

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, 'Senha deve ter pelo menos 6 caracteres')
      .max(100, 'Senha deve ter no máximo 100 caracteres')
      .regex(
        REGEX_PASSWORD,
        'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial',
      ),
    newPassword: z
      .string()
      .min(6, 'Senha deve ter pelo menos 6 caracteres')
      .max(100, 'Senha deve ter no máximo 100 caracteres')
      .regex(
        REGEX_PASSWORD,
        'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial',
      ),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
  })

export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>
