import { Priority, Status } from '@/utils/enums'
import { z } from 'zod'

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(100, 'Título deve ter no máximo 100 caracteres'),
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  deadline: z
    .string()
    .min(1, 'Prazo é obrigatório')
    .refine(val => {
      const date = new Date(val)
      return date > new Date()
    }, 'Prazo deve ser uma data futura'),
  priority: z.nativeEnum(Priority, {
    errorMap: () => ({ message: 'Prioridade inválida' }),
  }),
  status: z.nativeEnum(Status, {
    errorMap: () => ({ message: 'Status inválido' }),
  }),
  assigneeEmails: z
    .string()
    .optional()
    .refine(val => {
      if (!val) return true
      const emails = val
        .split(',')
        .map(e => e.trim())
        .filter(Boolean)
      return emails.every(email => z.string().email().safeParse(email).success)
    }, 'Todos os e-mails devem ser válidos'),
})

export type CreateTaskFormData = z.infer<typeof createTaskSchema>
