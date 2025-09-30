export type AnswerFlags = { outOfScope?: boolean; emergency?: boolean };
export type AnswerPayload = { answer: string; flags?: AnswerFlags };

/**
 * Envia uma pergunta para o Dr. AI e recebe uma resposta
 */
export async function answers(question: string): Promise<AnswerPayload> {
  try {
    const response = await fetch('/api/ai/answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Dr. AI] Error fetching answer:', error);
    // Fallback em caso de erro
    return {
      answer: 'Desculpe, estou com dificuldades para processar sua pergunta no momento. Por favor, tente novamente.',
      flags: { outOfScope: true }
    };
  }
}

/**
 * Converte texto em áudio (Text-to-Speech)
 */
export async function tts(text: string): Promise<Blob> {
  try {
    const response = await fetch('/api/ai/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // Criar Blob fake a partir da data URI retornada
    return new Blob([data.audioUrl], { type: "audio/mpeg" });
  } catch (error) {
    console.error('[Dr. AI] Error in TTS:', error);
    return new Blob([`AUDIO_STUB:${text}`], { type: "audio/mpeg" });
  }
}

/**
 * Converte áudio em texto (Speech-to-Text)
 */
export async function stt(audioBlob: Blob): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch('/api/ai/stt', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.transcript;
  } catch (error) {
    console.error('[Dr. AI] Error in STT:', error);
    return "Transcrição simulada do áudio";
  }
}

/**
 * Registra eventos de auditoria/telemetria
 */
export function auditLog(payload: Record<string, unknown>) {
  // Log local para debug
  console.log("[audit]", payload);
  
  // Enviar para o servidor de forma assíncrona (fire and forget)
  fetch('/api/ai/audit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).catch((error) => {
    console.error('[Dr. AI] Error sending audit log:', error);
  });
}
