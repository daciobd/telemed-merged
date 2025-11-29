import { z } from "zod";

export const virtualOfficeSchema = z.object({
  customUrl: z
    .string()
    .min(3, "A URL deve ter pelo menos 3 caracteres.")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens."),
  primeira_consulta: z
    .number({ invalid_type_error: "Informe um valor numérico." })
    .positive("O valor deve ser positivo.")
    .optional(),
  retorno: z
    .number({ invalid_type_error: "Informe um valor numérico." })
    .positive("O valor deve ser positivo.")
    .optional(),
  urgente: z
    .number({ invalid_type_error: "Informe um valor numérico." })
    .positive("O valor deve ser positivo.")
    .optional(),
  check_up: z
    .number({ invalid_type_error: "Informe um valor numérico." })
    .positive("O valor deve ser positivo.")
    .optional(),
});

export type VirtualOfficeFormData = z.infer<typeof virtualOfficeSchema>;
