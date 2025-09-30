// lib/ai.js - Lógica OpenAI para Dr. AI Assistant
import OpenAI from "openai";

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
export const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 15000);

export const SYSTEM_PROMPT = `Você é um assistente de orientações médicas do projeto Telemed.
FUNÇÃO: Ajudar pacientes a esclarecer dúvidas sobre orientações JÁ FORNECIDAS pelo médico na última consulta.

REGRAS IMPORTANTES:
1. SOMENTE responda com base nas orientações registradas que foram fornecidas
2. Se a pergunta não puder ser respondida com as informações disponíveis, diga: "Essa questão precisa ser esclarecida com o médico. Posso encaminhar?" e marque outOfScope=true
3. Se o paciente relatar sintomas NOVOS/PIORA ou sinais de emergência (dor no peito, falta de ar, sangramento intenso, confusão mental, reação alérgica grave, ideação suicida), diga para procurar atendimento imediato e marque emergency=true
4. Sempre comece com: "Com base nas orientações do Dr/Dra [NOME] em [DATA]..." quando houver esses dados
5. Use linguagem simples, empática, sem jargões médicos complexos
6. Seja conciso e objetivo nas respostas
7. Sempre reforce que não substitui consulta médica`;

export function detectEmergency(question) {
  return /dor no peito|falta de ar|sangramento|confus[aã]o|alergia grave|su[ií]cid|emerg[eê]ncia/i.test(question);
}

export async function askModel({ question, orientationsText, doctorName, consultDate }) {
  const preface = (doctorName && consultDate)
    ? `Com base nas orientações do ${doctorName} em ${consultDate}:\n\n`
    : "";

  // Guardrail simples: se não há orientações, marca out-of-scope direto
  if (!orientationsText?.trim()) {
    return { 
      answer: "Não localizei orientações registradas na sua última consulta. Posso encaminhar para o médico?", 
      flags: { outOfScope: true } 
    };
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `ORIENTAÇÕES DA ÚLTIMA CONSULTA:\n${orientationsText}\n\nPERGUNTA DO PACIENTE:\n${question}` }
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const completion = await openai.chat.completions.create(
      { 
        model: OPENAI_MODEL, 
        temperature: 0.2, 
        messages 
      },
      { signal: controller.signal }
    );

    const raw = completion.choices?.[0]?.message?.content?.trim() || "";

    // Heurística extra: se o modelo não citou o contexto (muito vago), força outOfScope
    const outOfScope = !/orienta(ç|c)[aã]o|dose|hor[aá]rio|retornar|exame|repouso|dieta/i.test(raw);

    return { 
      answer: preface + raw, 
      flags: { outOfScope } 
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('⏱️ OpenAI request timeout');
      return {
        answer: "Desculpe, houve um problema ao processar sua pergunta. Por favor, tente novamente.",
        flags: { outOfScope: true }
      };
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
