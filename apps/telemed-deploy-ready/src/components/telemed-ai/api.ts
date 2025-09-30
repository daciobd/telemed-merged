export type AnswerFlags = { outOfScope?: boolean; emergency?: boolean };
export type AnswerPayload = { answer: string; flags?: AnswerFlags };

export async function answers(question: string): Promise<AnswerPayload> {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  await sleep(650);
  if (/emerg[eê]ncia|dor no peito|falta de ar|sangramento|confus[aã]o/i.test(question)) {
    return { answer: "Percebo possível sinal de emergência. Preciso encaminhar você para atendimento médico. É urgente?", flags: { emergency: true } };
  }
  if (/medicamento|rem[eé]dio/i.test(question)) {
    return { answer: "Com base nas orientações do Dr. Silva em 25/09/2025:\n\nVocê deve tomar Losartana 50mg, 1 comprimido pela MANHÃ, todos os dias.\n\nRecomendação: tomar sempre no mesmo horário, após o café da manhã, com um copo de água.\n\nFicou claro? Tem mais alguma dúvida sobre as orientações da consulta?" };
  }
  if (/exerc[ií]cio/i.test(question)) {
    return { answer: "Com base nas orientações do Dr. Silva em 25/09/2025:\n\nVocê pode fazer caminhadas leves de 20-30 minutos, 3x por semana. Evite exercícios intensos por enquanto.\n\nSe sentir falta de ar ou cansaço excessivo, pare e descanse.\n\nTem mais alguma dúvida sobre as orientações?" };
  }
  return { answer: "Entendi sua pergunta. Vou verificar nas orientações registradas pelo Dr. Silva... Pode reformular sua dúvida de outra forma para eu entender melhor?", flags: { outOfScope: true } };
}

export async function tts(text: string): Promise<Blob> {
  return new Blob([`AUDIO_STUB:${text}`], { type: "audio/mpeg" });
}

export async function stt(audioBlob: Blob): Promise<string> {
  void audioBlob; return "Transcrição simulada do áudio";
}

export function auditLog(payload: Record<string, unknown>) {
  console.log("[audit]", payload);
}
