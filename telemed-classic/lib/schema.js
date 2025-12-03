// TeleMed — schema da resposta do Dr. AI (ESM + Zod em JavaScript)
// Mantém compatibilidade com o projeto e adiciona: ok, consulta_expirada, metadados extendidos
import { z } from 'zod';

export const AiResponseSchema = z.object({
  ok: z.boolean().default(true),
  tipo: z.enum([
    'esclarecimento',
    'escala_emergencia',
    'fora_escopo',
    'consulta_expirada',
    'erro'
  ]),
  mensagem: z.string().min(1),
  metadados: z.object({
    medico: z.string().optional().default(''),
    especialidade: z.string().optional(),
    data_consulta: z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/)
      .optional(),
    dias_desde_consulta: z.number().int().nonnegative().optional(),
    limite_dias: z.number().int().positive().optional(),
    trace_id: z.string().optional()
  })
    .optional()
    .default({})
});

export function validateAiResponse(payload) {
  return AiResponseSchema.safeParse(payload);
}

export const AiResponseSchemaFallback = {
  ok: false,
  tipo: 'erro',
  mensagem:
    'Não consegui processar sua pergunta de forma segura. Vou te conectar com a equipe médica agora.',
  metadados: {
    medico: ''
  }
};
