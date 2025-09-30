// lib/schema.js - Schema Zod para respostas estruturadas da IA
import { z } from "zod";

export const AiResponseSchema = z.object({
  tipo: z.enum(["esclarecimento", "escala_emergencia", "fora_escopo", "erro"]),
  mensagem: z.string().min(1),
  metadados: z.object({
    medico: z.string(),
    data_consulta: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/).optional().or(z.literal("")),
    especialidade: z.string().optional(),
  }).optional(),
});

export const AiResponseSchemaFallback = {
  tipo: "erro",
  mensagem: "Não consegui processar sua pergunta de forma segura. Vou te conectar com a equipe médica agora.",
  metadados: {
    medico: "",
    data_consulta: "",
  }
};
