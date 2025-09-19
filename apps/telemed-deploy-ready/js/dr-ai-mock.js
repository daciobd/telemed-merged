/**
 * Dr. AI Mock Service
 * Simula o microserviço Dr. AI com lógica de triagem real
 * Funciona offline e pode ser substituído pela API real quando disponível
 */

class DrAIMockService {
  constructor() {
    this.triagens = new Map();
    this.metrics = {
      today: { triagens: 0, precisao: 0.85, tempoMin: 2.8, satisfacao: 4.5 },
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
    this.events = [];
  }

  // Análise de triagem (algoritmo heurístico)
  async analyzeSymptoms(data) {
    const { symptoms_text = "", idade, genero, answers = {}, context = {} } = data;
    
    if (!symptoms_text.trim()) {
      throw new Error('symptoms_text é obrigatório');
    }

    const text = String(symptoms_text).toLowerCase();
    const triagem_id = `TRI-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Simular delay da análise
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    const analysis = this._analyzeSymptoms(text, answers);
    const redFlags = this._checkRedFlags(text, answers);

    const especialidade = analysis.specialty;
    const alternativas = this._getAlternatives(especialidade);
    const perguntas = this._getQuestions(especialidade);
    const orientacoes = this._getOrientations(especialidade);

    const triagem = {
      triagem_id,
      especialidade_sugerida: especialidade,
      confianca: analysis.confidence,
      alternativas,
      red_flags_checklist: redFlags,
      perguntas_residuais: perguntas,
      orientacoes_pre_consulta: orientacoes,
      explicacao: analysis.explanation,
      paciente_nome: context.paciente_nome || "Paciente",
      idade,
      genero,
      symptoms_text,
      answers,
      created_at: new Date().toISOString()
    };

    // Armazenar triagem
    this.triagens.set(triagem_id, triagem);
    
    // Atualizar métricas
    this.metrics.today.triagens++;
    if (this.metrics.specialties[especialidade]) {
      this.metrics.specialties[especialidade]++;
    } else {
      this.metrics.specialties["Outros"]++;
    }

    return triagem;
  }

  // Validação médica
  async validateTriage(data) {
    const { triagem_id, status, motivo, medico_id } = data;
    
    if (!triagem_id || !status) {
      throw new Error('triagem_id e status são obrigatórios');
    }

    const triagem = this.triagens.get(triagem_id);
    if (!triagem) {
      throw new Error('Triagem não encontrada');
    }

    // Registrar validação
    triagem.validation = {
      status,
      motivo: motivo || null,
      medico_id: medico_id || null,
      at: new Date().toISOString()
    };

    this.triagens.set(triagem_id, triagem);

    // Atualizar métricas
    if (status === 'agree') {
      this.metrics.today.precisao = Math.min(0.99, this.metrics.today.precisao + 0.001);
    } else if (status === 'adjust') {
      this.metrics.today.precisao = Math.max(0.50, this.metrics.today.precisao - 0.005);
    }

    return { 
      ok: true, 
      triagem: {
        id: triagem_id,
        validation: triagem.validation
      }
    };
  }

  // Obter métricas
  async getMetrics() {
    // Calcular tempo médio dinamicamente
    const avgTime = Math.max(1.5, 4.2 - (this.metrics.today.triagens * 0.02));
    
    return {
      today: {
        ...this.metrics.today,
        tempoMin: Math.round(avgTime * 10) / 10
      },
      specialties: this.metrics.specialties,
      accuracyBySpec: this.metrics.accuracyBySpec,
      updatedAt: new Date().toISOString()
    };
  }

  // Obter slots disponíveis
  async getSpecialtySlots(specialty = "Clínica Geral", date = null) {
    const now = new Date();
    const targetDate = date ? new Date(date) : now;
    
    // Mock slots baseado na especialidade
    const slots = [];
    const hours = specialty === "Neurologia" ? [9, 11, 14, 16, 18] : [8, 10, 13, 15, 17];
    
    for (const hour of hours) {
      const slot = new Date(targetDate);
      slot.setHours(hour, 0, 0, 0);
      
      // Não incluir slots passados
      if (slot > now) {
        slots.push(slot.toISOString());
      }
    }

    return {
      specialty,
      date: targetDate.toISOString().split('T')[0],
      slots
    };
  }

  // Registrar evento
  async trackEvent(data) {
    const { name, user_id, properties = {} } = data;
    
    if (!name) {
      throw new Error('name é obrigatório');
    }

    const event = {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      name,
      user_id,
      properties,
      timestamp: new Date().toISOString()
    };

    this.events.push(event);
    return { ok: true, id: event.id };
  }

  // Health check
  async health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'dr-ai-mock-service',
      version: '0.1.0'
    };
  }

  // === Métodos privados de análise ===

  _analyzeSymptoms(text, answers) {
    const rules = [
      { 
        pattern: /(dor de cabeça|cefaleia|enxaqueca|migra[íń]ea)/i,
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
    if (answers.febre_alta === true && matchedRule.specialty === "Neurologia") {
      confidence -= 3;
    }
    if (answers.rigidez_nuca === true && matchedRule.specialty === "Neurologia") {
      confidence += 10;
    }

    confidence = Math.max(5, Math.min(95, confidence));

    return {
      specialty: matchedRule.specialty,
      confidence: Math.round(confidence),
      explanation: explanationParts.length ? 
        `Critérios identificados: ${explanationParts.slice(0, 2).join(', ')}` :
        `Padrão sintomático compatível com ${matchedRule.specialty}`
    };
  }

  _checkRedFlags(text, answers) {
    return {
      rigidez_nuca: !!answers.rigidez_nuca,
      deficit_neurologico: !!answers.deficit_neurologico, 
      febre_alta: !!answers.febre_alta,
      dor_toracica_tipica: /(dor no peito|opressão torácica)/i.test(text),
      dispneia_severa: /(falta de ar severa|muito cansado)/i.test(text),
      alteracao_consciencia: !!answers.alteracao_consciencia
    };
  }

  _getAlternatives(specialty) {
    const alternatives = {
      "Neurologia": ["Clínica Geral", "Medicina Interna"],
      "Cardiologia": ["Clínica Geral", "Medicina Interna"],
      "Gastroenterologia": ["Clínica Geral", "Medicina Interna"],
      "Dermatologia": ["Clínica Geral"],
      "Ortopedia": ["Clínica Geral", "Reumatologia"],
      "Pneumologia": ["Clínica Geral", "Medicina Interna"]
    };
    
    return alternatives[specialty] || ["Clínica Geral"];
  }

  _getQuestions(specialty) {
    const questions = {
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
      ]
    };
    
    return questions[specialty] || [
      "Quando os sintomas iniciaram?",
      "Há fatores que pioram ou melhoram?",
      "Uso atual de medicações?"
    ];
  }

  _getOrientations(specialty) {
    const orientations = {
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
      ]
    };
    
    return orientations[specialty] || [
      "Manter medicações habituais",
      "Hidratação adequada",
      "Repouso relativo",
      "Anotar evolução dos sintomas"
    ];
  }
}

// Instância global do serviço mock
window.DrAIMockService = DrAIMockService;
window.drAIService = new DrAIMockService();

console.log('🤖 Dr. AI Mock Service carregado');