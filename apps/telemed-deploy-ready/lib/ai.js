// lib/ai.js - Lógica OpenAI para Dr. AI Assistant com validação JSON + Retry + Fallback
import OpenAI from "openai";
import { buildSystemPrompt, buildUserMessage } from "./prompt.js";
import { AiResponseSchema, AiResponseSchemaFallback } from "./schema.js";
import { retry, withTimeout } from "../util/retry.js";

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
export const OPENAI_FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || "gpt-4o-mini";
export const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 15000);
export const OPENAI_MAX_RETRIES = Number(process.env.OPENAI_MAX_RETRIES || 2);

export function detectEmergency(question) {
  return /dor no peito|falta de ar|sangramento|confus[aã]o|alergia grave|su[ií]cid|emerg[eê]ncia/i.test(question);
}

// Função auxiliar para chamar modelo com timeout
async function callModel(model, messages) {
  const completion = await withTimeout(
    openai.chat.completions.create({ 
      model, 
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages 
    }),
    OPENAI_TIMEOUT_MS
  );
  return completion.choices?.[0]?.message?.content?.trim() || "";
}

// Função auxiliar para parsear e validar resposta
function parseAndValidate(raw) {
  try {
    // Extrair primeiro bloco JSON se vier texto extra
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const candidate = jsonMatch ? jsonMatch[0] : raw;
    const parsed = JSON.parse(candidate);
    
    // Validar com Zod
    const result = AiResponseSchema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
      console.error("❌ Resposta fora do schema:", issues);
      return null;
    }
    
    return result.data;
  } catch (parseError) {
    console.error("❌ AI retornou conteúdo não-JSON:", raw);
    return null;
  }
}

export async function askModelJSON({ question, orientationsText, doctorName, consultDate, specialty }) {
  // Construir contexto seguro
  const contextoSeguro = buildContextoSeguro({ orientationsText, doctorName, consultDate, specialty });

  // Guardrail: sem orientações = fora de escopo
  if (!orientationsText?.trim()) {
    return { 
      tipo: "fora_escopo",
      mensagem: "Não localizei orientações registradas na sua última consulta. Posso encaminhar para o médico?",
      metadados: { medico: doctorName || "", data_consulta: consultDate || "" }
    };
  }

  const systemPrompt = buildSystemPrompt(contextoSeguro);
  const userMessage = buildUserMessage(question);

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  ];

  try {
    // 1) Tentar modelo primário com retry
    let raw = await retry(() => callModel(OPENAI_MODEL, messages), { 
      retries: OPENAI_MAX_RETRIES, 
      baseMs: 300 
    });
    
    let validated = parseAndValidate(raw);
    
    // 2) Se falhou, tentar modelo fallback (se diferente do primário)
    if (!validated && OPENAI_FALLBACK_MODEL !== OPENAI_MODEL) {
      console.warn(`⚠️ Fallback para modelo ${OPENAI_FALLBACK_MODEL}`);
      raw = await retry(() => callModel(OPENAI_FALLBACK_MODEL, messages), { 
        retries: OPENAI_MAX_RETRIES, 
        baseMs: 300 
      });
      validated = parseAndValidate(raw);
    }
    
    // 3) Se ainda falhou, retornar fallback seguro
    if (!validated) {
      console.error("❌ Todos os modelos falharam ou retornaram JSON inválido");
      return { ...AiResponseSchemaFallback };
    }
    
    return validated;
  } catch (error) {
    if (error.message === 'timeout') {
      console.error('⏱️ OpenAI request timeout');
      return {
        tipo: "erro",
        mensagem: "Desculpe, houve um problema ao processar sua pergunta. Por favor, tente novamente.",
        metadados: { medico: doctorName || "", data_consulta: consultDate || "" }
      };
    }
    console.error("❌ Erro na chamada OpenAI:", error);
    return { ...AiResponseSchemaFallback };
  }
}

function buildContextoSeguro({ orientationsText, doctorName, consultDate, specialty }) {
  const daysSince = consultDate ? calculateDaysSince(consultDate) : null;
  
  return `
INFORMAÇÕES DO MÉDICO:
- Nome: ${doctorName || "Não informado"}
- Especialidade: ${specialty || "Não informada"}
- Data da última consulta: ${consultDate || "Não informada"}${daysSince ? ` (${daysSince} dias atrás)` : ""}

ORIENTAÇÕES REGISTRADAS NA CONSULTA:
${orientationsText}

DATA DE RETORNO: Verificar com o paciente se há retorno agendado
`.trim();
}

function calculateDaysSince(dateStr) {
  try {
    const [day, month, year] = dateStr.split('/');
    const consultDateObj = new Date(year, month - 1, day);
    const now = new Date();
    const diffTime = Math.abs(now - consultDateObj);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return null;
  }
}
