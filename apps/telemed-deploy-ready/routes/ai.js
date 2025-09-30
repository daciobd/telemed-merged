// routes/ai.js - Handlers para rotas do Dr. AI Assistant

/**
 * Helper para enviar resposta JSON
 */
function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * Handler para /api/ai/answers
 * Processa perguntas usando OpenAI + RAG com Postgres
 */
export async function handleAnswers(req, res, body) {
  try {
    const { question, patientId = 1 } = JSON.parse(body || "{}");
    
    if (!question) {
      return sendJSON(res, 400, { error: "question é obrigatório" });
    }

    // Importações dinâmicas para evitar problemas com ES modules
    const { askModel, detectEmergency } = await import('../lib/ai.js');
    const { getLastEncounterWithOrientations } = await import('../lib/db.js');

    // Buscar contexto da última consulta
    const context = await getLastEncounterWithOrientations(patientId);
    
    if (!context) {
      return sendJSON(res, 200, { 
        answer: "Não encontrei sua última consulta no sistema. Posso encaminhar ao médico?", 
        flags: { outOfScope: true } 
      });
    }

    const { encounter, orientations } = context;
    const orientationsText = orientations
      .map(o => `- ${o.orientation_type || "geral"}: ${o.content}`)
      .join("\n");

    // Gerar resposta com OpenAI
    const { answer, flags } = await askModel({
      question,
      orientationsText,
      doctorName: "Dr. Silva",
      consultDate: new Date(encounter.date).toLocaleDateString("pt-BR"),
    });

    // Detectar emergências adicionalmente
    const emergency = detectEmergency(question);

    console.log(`🤖 Dr. AI Answer: "${question}" -> ${answer.substring(0, 50)}...`);

    return sendJSON(res, 200, { 
      answer, 
      flags: { ...flags, emergency } 
    });
  } catch (error) {
    console.error('❌ Error in handleAnswers:', error);
    return sendJSON(res, 500, { 
      error: "Erro ao processar pergunta",
      answer: "Desculpe, houve um problema ao processar sua pergunta. Por favor, tente novamente."
    });
  }
}

/**
 * Handler para /api/ai/tts
 * Text-to-Speech (stub - trocar por provedor real)
 */
export async function handleTTS(req, res, body) {
  try {
    const { text } = JSON.parse(body || "{}");
    
    if (!text) {
      return sendJSON(res, 400, { error: "text é obrigatório" });
    }

    // TODO: Integrar com provedor TTS real (ElevenLabs, Azure, Google)
    const b64 = Buffer.from(`AUDIO_STUB:${text}`).toString("base64");
    
    console.log(`🔊 Dr. AI TTS: "${text.substring(0, 30)}..."`);
    
    return sendJSON(res, 200, { 
      url: `data:audio/mpeg;base64,${b64}` 
    });
  } catch (error) {
    console.error('❌ Error in handleTTS:', error);
    return sendJSON(res, 500, { error: "Erro ao gerar áudio" });
  }
}

/**
 * Handler para /api/ai/stt
 * Speech-to-Text (stub - trocar por provedor real)
 */
export async function handleSTT(req, res, body) {
  try {
    // TODO: Integrar com provedor STT real (Whisper, Google, Azure)
    await Promise.resolve(); // Evitar warning de unused parameter
    
    console.log(`🎤 Dr. AI STT: Audio received`);
    
    return sendJSON(res, 200, { 
      text: "Transcrição simulada do áudio" 
    });
  } catch (error) {
    console.error('❌ Error in handleSTT:', error);
    return sendJSON(res, 500, { error: "Erro ao transcrever áudio" });
  }
}

/**
 * Handler para /api/ai/escalations
 * Registra escalação para atendimento médico
 */
export async function handleEscalations(req, res, body) {
  try {
    const payload = JSON.parse(body || "{}");
    
    console.log(`🚨 Dr. AI Escalation: ${JSON.stringify(payload)}`);
    
    // TODO: Implementar lógica real de escalação
    // - Criar ticket no sistema
    // - Notificar médico responsável
    // - Registrar no banco de dados
    
    return sendJSON(res, 200, { ok: true });
  } catch (error) {
    console.error('❌ Error in handleEscalations:', error);
    return sendJSON(res, 500, { error: "Erro ao processar escalação" });
  }
}

/**
 * Handler para /api/ai/audit
 * Registra eventos de auditoria/telemetria
 */
export async function handleAudit(req, res, body) {
  try {
    const payload = JSON.parse(body || "{}");
    
    console.log(`🔒 Dr. AI Audit: ${JSON.stringify(payload)}`);
    
    // TODO: Salvar auditoria no banco de dados
    // - Registrar interações do usuário
    // - Compliance LGPD
    // - Analytics
    
    return sendJSON(res, 200, { ok: true });
  } catch (error) {
    console.error('❌ Error in handleAudit:', error);
    return sendJSON(res, 500, { error: "Erro ao registrar auditoria" });
  }
}
