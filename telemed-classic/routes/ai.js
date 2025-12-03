// routes/ai.js - Handlers para rotas do Dr. AI Assistant com Auditoria LGPD + Rate Limiting

// Configuração de rate limiting
const RL_PATIENT_PER_MIN = Number(process.env.RL_PATIENT_PER_MIN || 12); // req/min por paciente
const RL_IP_PER_MIN = Number(process.env.RL_IP_PER_MIN || 60);          // req/min por IP
const REDIS_URL = process.env.REDIS_URL; // Opcional: habilita limiter distribuído

let limiter = null;

/**
 * Helper para enviar resposta JSON
 */
function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * Helper para obter corpo da requisição
 */
function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Handler para /api/ai/answers
 * Processa perguntas usando OpenAI + RAG com Postgres
 * Retorna JSON estruturado validado com Zod + Rate Limiting
 */
async function handleAnswers(req, res) {
  try {
    const body = await getBody(req);
    const { question, patientId = 1 } = body;
    
    if (!question) {
      return sendJSON(res, 400, { 
        tipo: "erro",
        mensagem: "Pergunta é obrigatória",
        metadados: { medico: "", data_consulta: "" }
      });
    }

    // Importações dinâmicas para ES modules
    const { askModelJSON, detectEmergency } = await import('../lib/ai.js');
    const { getLastEncounterWithOrientations } = await import('../lib/db.js');
    const { auditInteraction } = await import('../util/audit.js');
    const { safetyValidator } = await import('../util/safety-validator.js');
    const { consultationPolicy } = await import('../util/consultation-policy.js');
    
    // Inicializar limiter se ainda não foi (Redis se disponível, senão in-memory)
    if (!limiter) {
      if (REDIS_URL) {
        const { makeRedisRateLimiter } = await import('../util/redis-rate-limit.js');
        limiter = makeRedisRateLimiter({ 
          url: REDIS_URL,
          perMinuteByPatient: RL_PATIENT_PER_MIN, 
          perMinuteByIp: RL_IP_PER_MIN 
        });
      } else {
        const { makeRateLimiter } = await import('../util/rate-limit.js');
        limiter = makeRateLimiter({ 
          perMinuteByPatient: RL_PATIENT_PER_MIN, 
          perMinuteByIp: RL_IP_PER_MIN 
        });
      }
    }

    // IP real (suporta proxies)
    const ip = (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() || req.socket.remoteAddress || "";

    // Gate de rate limit
    const { rateLimitBlocks } = await import('../util/metrics.js');
    const rl = await limiter.allow({ patientId, ip });
    if (!rl.ok) {
      rateLimitBlocks.inc({ key_type: rl.reason || "unknown" });
      res.setHeader("Retry-After", String(rl.retryAfterSec));
      return sendJSON(res, 429, { 
        tipo: "erro",
        mensagem: `Muitas requisições. Tente novamente em ${rl.retryAfterSec} segundos.`,
        metadados: { medico: "", data_consulta: "" },
        retryAfterSec: rl.retryAfterSec 
      });
    }

    // VALIDAÇÃO DE SEGURANÇA: Verificar pergunta antes de processar
    const { safetyValidations, escalations } = await import('../util/metrics.js');
    const validation = safetyValidator.validateQuestion(question);
    
    if (!validation.safe) {
      safetyValidations.inc({ type: validation.type, triggered: "true" });
      
      // Emergência detectada
      if (validation.type === 'emergency') {
        escalations.inc({ tipo: "escala_emergencia" });
        return sendJSON(res, 200, {
          tipo: "escala_emergencia",
          mensagem: `ATENÇÃO: Detectei sinais de possível emergência médica (${validation.keyword}). Vou te conectar com a equipe médica AGORA. Por favor, aguarde.`,
          metadados: { medico: "", data_consulta: "" },
          emergency_keyword: validation.keyword
        });
      }
      
      // Sintoma novo detectado
      if (validation.type === 'new_symptom') {
        escalations.inc({ tipo: "escala_emergencia" });
        return sendJSON(res, 200, {
          tipo: "escala_emergencia",
          mensagem: `Percebo que você está relatando algo novo (${validation.keyword}). Preciso encaminhar você para avaliação médica. Vou conectar você com a equipe agora.`,
          metadados: { medico: "", data_consulta: "" },
          new_symptom_keyword: validation.keyword
        });
      }
      
      // Fora de escopo
      if (validation.type === 'out_of_scope') {
        escalations.inc({ tipo: "fora_escopo" });
        return sendJSON(res, 200, {
          tipo: "fora_escopo",
          mensagem: `Essa questão (${validation.keyword}) está fora do meu escopo de esclarecer orientações existentes. Posso agendar um contato com seu médico para discutir isso?`,
          metadados: { medico: "", data_consulta: "" },
          out_of_scope_keyword: validation.keyword
        });
      }
    } else {
      safetyValidations.inc({ type: "none", triggered: "false" });
    }

    // Buscar contexto da última consulta
    const context = await getLastEncounterWithOrientations(patientId);
    
    if (!context) {
      return sendJSON(res, 200, { 
        tipo: "fora_escopo",
        mensagem: "Não encontrei sua última consulta no sistema. Posso encaminhar ao médico?",
        metadados: { medico: "", data_consulta: "" }
      });
    }

    const { encounter, orientations } = context;
    const orientationsText = orientations
      .map(o => `- ${o.orientation_type || "geral"}: ${o.content}`)
      .join("\n");

    const doctorName = "Dr. Silva";
    const consultDate = new Date(encounter.date).toLocaleDateString("pt-BR");
    const specialty = encounter.specialty || "Clínica Geral";
    
    // VALIDAÇÃO DE POLÍTICA: Verificar idade da consulta por especialidade
    const consultDateObj = new Date(encounter.date);
    const daysSince = Math.floor((Date.now() - consultDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    const ageValidation = consultationPolicy.validateConsultationAge(daysSince, specialty);
    
    if (!ageValidation.valid) {
      return sendJSON(res, 200, {
        tipo: "fora_escopo",
        mensagem: ageValidation.message,
        metadados: {
          medico: doctorName,
          data_consulta: consultDate,
          especialidade: specialty,
          dias_desde_consulta: daysSince,
          limite_dias: ageValidation.limit
        }
      });
    }

    // Gerar resposta estruturada com OpenAI + Validação Zod + Deny-list
    const response = await askModelJSON({
      question,
      orientationsText,
      doctorName,
      consultDate,
      specialty
    });

    // Detectar emergências adicionalmente (override se necessário)
    const emergency = detectEmergency(question);
    if (emergency && response.tipo !== "escala_emergencia") {
      response.tipo = "escala_emergencia";
      response.mensagem = `ATENÇÃO: Detectei sinais de possível emergência. ${response.mensagem}`;
    }

    // Auditoria LGPD-compliant com redação de PII
    await auditInteraction({
      encounterId: encounter.id,
      patientId,
      question,
      answer: response.mensagem,
      escalation: response.tipo === "fora_escopo",
      emergency: response.tipo === "escala_emergencia"
    });

    // LOGGING SEGURO: Salvar com truncamento + hash
    const { safeStore } = await import('../util/log-safe.js');
    const { saveAiInteraction } = await import('../lib/db.js');
    
    const { truncated: qTrunc, digest: qHash } = safeStore(question, 500);
    const { truncated: rTrunc, digest: rHash } = safeStore(response.mensagem, 500);
    
    await saveAiInteraction({
      patientId,
      encounterId: encounter.id,
      questionTrunc: qTrunc,
      questionHash: qHash,
      responseTrunc: rTrunc,
      responseHash: rHash,
      escalationTriggered: response.tipo === "escala_emergencia" || response.tipo === "fora_escopo",
      escalationReason: response.tipo !== "esclarecimento" ? response.tipo : null,
      metadata: {
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        version: "v1",
        specialty: specialty
      }
    });

    console.log(`🤖 Dr. AI Answer [${response.tipo}]: "${question}" -> ${response.mensagem.substring(0, 50)}...`);

    return sendJSON(res, 200, response);
  } catch (error) {
    console.error('❌ Error in handleAnswers:', error);
    return sendJSON(res, 500, { 
      tipo: "erro",
      mensagem: "Desculpe, houve um problema ao processar sua pergunta. Por favor, tente novamente.",
      metadados: { medico: "", data_consulta: "" }
    });
  }
}

/**
 * Handler para /api/ai/tts
 * Text-to-Speech (stub - trocar por provedor real)
 */
async function handleTTS(req, res) {
  try {
    const body = await getBody(req);
    const { text } = body;
    
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
async function handleSTT(req, res) {
  try {
    // TODO: Integrar com provedor STT real (Whisper, Google, Azure)
    await getBody(req); // Ler body mesmo que não use
    
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
async function handleEscalations(req, res) {
  try {
    const payload = await getBody(req);
    
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
async function handleAudit(req, res) {
  try {
    const payload = await getBody(req);
    
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

// Alias para manter compatibilidade (singular)
function handleAnswer(req, res) {
  return handleAnswers(req, res);
}

module.exports = {
  handleAnswers,
  handleAnswer,
  handleTTS,
  handleSTT,
  handleEscalations,
  handleAudit
};
