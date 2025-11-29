import { z } from "zod";

export const virtualOfficeSchema = z.object({
  customUrl: z
    .string()
    .min(3, "A URL deve ter pelo menos 3 caracteres.")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens."),
  primeira_consulta: z
    .number({
      invalid_type_error: "Informe um valor numérico ou deixe em branco.",
    })
    .positive("O valor deve ser positivo.")
    .optional()
    .nullable(),
  retorno: z
    .number({
      invalid_type_error: "Informe um valor numérico ou deixe em branco.",
    })
    .positive("O valor deve ser positivo.")
    .optional()
    .nullable(),
  urgente: z
    .number({
      invalid_type_error: "Informe um valor numérico ou deixe em branco.",
    })
    .positive("O valor deve ser positivo.")
    .optional()
    .nullable(),
  check_up: z
    .number({
      invalid_type_error: "Informe um valor numérico ou deixe em branco.",
    })
    .positive("O valor deve ser positivo.")
    .optional()
    .nullable(),
  autoAccept: z.boolean().default(true),
  workDays: z.array(z.string()).nonempty("Escolha ao menos um dia de trabalho."),
  startTime: z.string().min(1, "Informe o horário inicial."),
  endTime: z.string().min(1, "Informe o horário final."),
});

export type VirtualOfficeFormData = z.infer<typeof virtualOfficeSchema>;
