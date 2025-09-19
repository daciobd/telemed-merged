#!/usr/bin/env node
/**
 * Dr. AI Microservice
 * API de triagem médica automatizada integrada ao TeleMed
 * Especificação: OpenAPI 3.0.3 fornecida pelo usuário
 */

const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers['x-auth'];
  const expectedToken = process.env.DRAI_API_TOKEN || 'dev-token-123';
  
  if (!token || token !== expectedToken) {
    return res.status(401).json({ 
      ok: false, 
      error: 'Unauthorized - X-Auth header required' 
    });
  }
  next();
};

// In-memory storage (production seria PostgreSQL)
const triagens = new Map();
const events = [];
const metrics = {
  today: { 
    triagens: 0, 
    precisao: 0.85, 
    tempoMin: 2.8, 
    satisfacao: 4.5 
  },
  specialties: { 
    "Clínica Geral": 25, 
    "Neurologia": 18, 
    "Cardiologia": 15, 
    "Dermatologia": 12,
    "Gastroenterologia": 8,
    "Outros": 10 
  },
  accuracyBySpec: { 
    "Neurologia": 0.87, 
    "Cardiologia": 0.82, 
    "Clínica Geral": 0.88,
    "Dermatologia": 0.91,
    "Gastroenterologia": 0.79
  }
};

// === HEALTH CHECK ===
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'dr-ai-service',
    version: '0.1.0'
  });
});

// === TRIAGE ANALYSIS ===
app.post(['/triage/analyze', '/api/triage/analyze'], authMiddleware, (req, res) => {
  const { symptoms_text = "", idade, genero, answers = {}, context = {} } = req.body || {};
  
  if (!symptoms_text.trim()) {
    return res.status(400).json({
      ok: false,
      error: 'symptoms_text é obrigatório'
    });
  }

  const text = String(symptoms_text).toLowerCase();
  const triagem_id = `TRI-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  // Algoritmo de triagem simplificado (heurístico)
  function analyzeSymptoms(text, answers) {
    // Detecção de especialidade por palavras-chave
    const rules = [
      { 
        pattern: /(dor de cabeça|cefaleia|enxaqueca|migra[ín]ea)/i,
        specialty: "Neurologia",
        confidence: 75,
        boosts: [
          { condition: /(fotofobia|pior com luz)/i, value: 8 },
          { condition: /(náusea|vômito)/i, value: 5 },
          { condition: /há mais de (2|3|4|5) dias/i, value: 6 }
        ]
      },
      { 
        pattern: /(dor no peito|dor torácica|peito|coração)/i,
        specialty: "Cardiologia",
        confidence: 70,
        boosts: [
          { condition: /(falta de ar|dispneia)/i, value: 10 },
          { condition: /(suor frio|sudorese)/i, value: 7 }
        ]
      },
      { 
        pattern: /(falta de ar|dispneia|tosse)/i,
        specialty: "Pneumologia", 
        confidence: 72,
        boosts: [
          { condition: /(febre)/i, value: 8 },
          { condition: /(chiado|sibilo)/i, value: 6 }
        ]
      },
      { 
        pattern: /(dor abdominal|dor na barriga|abdome|estômago)/i,
        specialty: "Gastroenterologia",
        confidence: 74,
        boosts: [
          { condition: /(náusea|vômito)/i, value: 6 },
          { condition: /(diarreia)/i, value: 5 }
        ]
      },
      { 
        pattern: /(dor nas costas|lombar|coluna)/i,
        specialty: "Ortopedia",
        confidence: 76,
        boosts: [
          { condition: /(irradiação|irradia)/i, value: 5 }
        ]
      },
      { 
        pattern: /(pele|mancha|lesão|coceira|prurido)/i,
        specialty: "Dermatologia",
        confidence: 80,
        boosts: [
          { condition: /(vermelhidão|eritema)/i, value: 6 }
        ]
      }
    ];

    // Encontrar regra correspondente
    let matchedRule = null;
    for (const rule of rules) {
      if (rule.pattern.test(text)) {
        matchedRule = rule;
        break;
      }
    }

    // Fallback para clínica geral
    if (!matchedRule) {
      return {
        specialty: "Clínica Geral",
        confidence: 65,
        explanation: "Sintomas gerais - triagem para avaliação clínica inicial"
      };
    }

    // Calcular confiança com boosts
    let confidence = matchedRule.confidence;
    let explanationParts = [];

    for (const boost of matchedRule.boosts) {
      if (boost.condition.test(text)) {
        confidence += boost.value;
        explanationParts.push(boost.condition.source);
      }
    }

    // Ajustes baseados em respostas
    if (answers.febre === true && matchedRule.specialty === "Neurologia") {
      confidence -= 3; // Febre pode indicar outras causas
    }
    if (answers.rigidez_nuca === true && matchedRule.specialty === "Neurologia") {
      confidence += 10; // Red flag importante
    }

    confidence = Math.max(5, Math.min(95, confidence));

    return {
      specialty: matchedRule.specialty,
      confidence: Math.round(confidence),
      explanation: explanationParts.length ? 
        `Critérios: ${explanationParts.slice(0, 2).join(', ')}` :
        `Padrão sintomático típico para ${matchedRule.specialty}`
    };
  }

  const analysis = analyzeSymptoms(text, answers);

  // Red flags checklist
  const redFlags = {
    rigidez_nuca: !!answers.rigidez_nuca,
    deficit_neurologico: !!answers.deficit_neurologico, 
    febre_alta: !!answers.febre_alta,
    dor_toracica_tipica: /(dor no peito|opressão torácica)/i.test(text),
    dispneia_severa: /(falta de ar severa|muito cansado)/i.test(text),
    alteracao_consciencia: !!answers.alteracao_consciencia
  };

  // Perguntas residuais baseadas na especialidade
  const perguntasPorEspecialidade = {
    "Neurologia": [
      "Já apresentou episódios similares anteriormente?",
      "A dor piora com movimentos da cabeça?",
      "Há presença de aura visual antes da dor?"
    ],
    "Cardiologia": [
      "A dor irradia para braço, pescoço ou mandíbula?",
      "Piora com esforço físico?",
      "Há histórico familiar de problemas cardíacos?"
    ],
    "Gastroenterologia": [
      "A dor tem relação com alimentação?",
      "Há mudanças no hábito intestinal?",
      "Uso recente de medicamentos?"
    ],
    default: [
      "Quando os sintomas iniciaram?",
      "Há fatores que pioram ou melhoram?",
      "Uso atual de medicações?"
    ]
  };

  // Orientações pré-consulta
  const orientacoesPorEspecialidade = {
    "Neurologia": [
      "Manter ambiente com pouca luminosidade",
      "Hidratação adequada",
      "Evitar jejum prolongado",
      "Anotar horários e intensidade das crises"
    ],
    "Cardiologia": [
      "Evitar esforços físicos até avaliação",
      "Monitorar pressão arterial se possível",
      "Jejum de 8h se exames forem necessários"
    ],
    "Gastroenterologia": [
      "Dieta leve e fracionada",
      "Hidratação oral",
      "Evitar medicamentos sem orientação",
      "Anotar características de evacuações se relevante"
    ],
    default: [
      "Manter medicações habituais",
      "Hidratação adequada",
      "Repouso relativo",
      "Anotar evolução dos sintomas"
    ]
  };

  const especialidade = analysis.specialty;
  const alternativas = especialidade === "Clínica Geral" ? 
    ["Medicina da Família"] : 
    ["Clínica Geral", especialidade === "Neurologia" ? "Medicina Interna" : "Medicina da Família"];

  const triagem = {
    triagem_id,
    especialidade_sugerida: especialidade,
    confianca: analysis.confidence,
    alternativas,
    red_flags_checklist: redFlags,
    perguntas_residuais: perguntasPorEspecialidade[especialidade] || perguntasPorEspecialidade.default,
    orientacoes_pre_consulta: orientacoesPorEspecialidade[especialidade] || orientacoesPorEspecialidade.default,
    explicacao: analysis.explanation,
    paciente_nome: context.paciente_nome || "Não informado",
    idade,
    genero,
    symptoms_text,
    answers,
    created_at: new Date().toISOString()
  };

  // Armazenar triagem
  triagens.set(triagem_id, triagem);
  
  // Atualizar métricas
  metrics.today.triagens++;
  if (metrics.specialties[especialidade]) {
    metrics.specialties[especialidade]++;
  } else {
    metrics.specialties["Outros"]++;
  }

  res.json(triagem);
});

// === VALIDATION ===
app.post(['/triagem/validate', '/api/triagem/validate'], authMiddleware, (req, res) => {
  const { triagem_id, status, motivo, medico_id } = req.body || {};
  
  if (!triagem_id || !status) {
    return res.status(400).json({ 
      ok: false, 
      error: 'triagem_id e status são obrigatórios' 
    });
  }

  if (!['agree', 'adjust'].includes(status)) {
    return res.status(400).json({
      ok: false,
      error: 'status deve ser "agree" ou "adjust"'
    });
  }

  const triagem = triagens.get(triagem_id);
  if (!triagem) {
    return res.status(404).json({
      ok: false,
      error: 'Triagem não encontrada'
    });
  }

  // Registrar validação
  triagem.validation = {
    status,
    motivo: motivo || null,
    medico_id: medico_id || null,
    at: new Date().toISOString()
  };

  triagens.set(triagem_id, triagem);

  // Atualizar métricas de precisão
  if (status === 'agree') {
    metrics.today.precisao = Math.min(0.99, metrics.today.precisao + 0.001);
  } else if (status === 'adjust') {
    metrics.today.precisao = Math.max(0.50, metrics.today.precisao - 0.005);
  }

  // Emitir evento para TeleMed principal
  const event = {
    name: 'dr_ai_validated',
    triagem_id,
    status,
    medico_id,
    timestamp: new Date().toISOString()
  };
  
  // POST para TeleMed principal (se configurado)
  if (process.env.TELEMED_INTERNAL_URL) {
    // Async call - não bloquear resposta
    fetch(`${process.env.TELEMED_INTERNAL_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    }).catch(err => console.log('Event emit failed:', err.message));
  }

  res.json({ 
    ok: true, 
    triagem: {
      id: triagem_id,
      validation: triagem.validation
    }
  });
});

// === METRICS ===
app.get(['/metrics/summary', '/api/metrics/summary'], authMiddleware, (req, res) => {
  // Calcular tempo médio (mock baseado em número de triagens)
  const avgTime = Math.max(1.5, 4.2 - (metrics.today.triagens * 0.02));
  
  res.json({
    today: {
      ...metrics.today,
      tempoMin: Math.round(avgTime * 10) / 10
    },
    specialties: metrics.specialties,
    accuracyBySpec: metrics.accuracyBySpec,
    updatedAt: new Date().toISOString()
  });
});

// === SPECIALTIES SLOTS ===
app.get(['/specialties/slots', '/api/specialties/slots'], authMiddleware, (req, res) => {
  const { specialty = "Clínica Geral", date } = req.query;
  
  // Mock de slots baseado na especialidade
  const now = new Date();
  const targetDate = date ? new Date(date) : now;
  
  // Gerar slots realistas
  const slots = [];
  const hours = specialty === "Neurologia" ? [9, 11, 14, 16, 18] : [8, 10, 13, 15, 17];
  
  for (const hour of hours) {
    const slot = new Date(targetDate);
    slot.setHours(hour, 0, 0, 0);
    
    // Não incluir slots passados no dia atual
    if (slot > now) {
      slots.push(slot.toISOString());
    }
  }

  res.json({
    specialty,
    date: targetDate.toISOString().split('T')[0],
    slots
  });
});

// === EVENTS TRACKING ===
app.post(['/events', '/api/events'], authMiddleware, (req, res) => {
  const { name, user_id, properties = {} } = req.body || {};
  
  if (!name) {
    return res.status(400).json({
      ok: false,
      error: 'name é obrigatório'
    });
  }

  const event = {
    id: `evt_${uuid()}`,
    name,
    user_id,
    properties,
    timestamp: new Date().toISOString()
  };

  events.push(event);

  // Forward para TeleMed principal se configurado
  if (process.env.TELEMED_INTERNAL_URL) {
    fetch(`${process.env.TELEMED_INTERNAL_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    }).catch(err => console.log('Event forward failed:', err.message));
  }

  res.json({ 
    ok: true, 
    id: event.id 
  });
});

// === ERROR HANDLING ===
app.use((err, req, res, next) => {
  console.error('Dr. AI Error:', err);
  res.status(500).json({
    ok: false,
    error: 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: 'Endpoint not found'
  });
});

// === SERVER STARTUP ===
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 Dr. AI Microservice running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Auth token configured: ${!!process.env.DRAI_API_TOKEN}`);
  console.log(`TeleMed integration: ${process.env.TELEMED_INTERNAL_URL || 'disabled'}`);
});

module.exports = app;