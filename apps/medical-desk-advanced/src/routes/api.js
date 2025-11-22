// API Routes for Medical Desk Advanced

export function setupAPIRoutes(app) {
  
  // ============================================
  // STATS ENDPOINT
  // ============================================
  app.get('/api/stats', (req, res) => {
    res.json({
      protocolosAtivos: 12,
      sugestoesHoje: 45,
      alertasVies: 3,
      taxaAprovacao: 94,
      timestamp: new Date().toISOString()
    });
  });

  // ============================================
  // PATIENTS ENDPOINT
  // ============================================
  app.get('/api/patients', (req, res) => {
    res.json([
      {
        id: 1,
        name: 'João Silva',
        age: 58,
        condition: 'SCA com dor torácica',
        status: 'critical',
        admissionDate: '2025-01-20T10:30:00Z'
      },
      {
        id: 2,
        name: 'Maria Costa',
        age: 72,
        condition: 'Pneumonia grave (CURB-65=4)',
        status: 'critical',
        admissionDate: '2025-01-21T08:15:00Z'
      },
      {
        id: 3,
        name: 'Pedro Santos',
        age: 45,
        condition: 'Hipertensão descompensada',
        status: 'stable',
        admissionDate: '2025-01-21T14:20:00Z'
      }
    ]);
  });

  // ============================================
  // PROTOCOLS ENDPOINT (lista completa)
  // ============================================
  app.get('/api/protocols', (req, res) => {
    res.json([
      {
        id: 1,
        name: 'Protocolo SCA',
        description: 'Síndrome Coronariana Aguda',
        usage: 245,
        accuracy: 94,
        lastUpdated: '2025-01-15T00:00:00Z'
      },
      {
        id: 2,
        name: 'Protocolo Pneumonia',
        description: 'Pneumonia Adquirida na Comunidade',
        usage: 189,
        accuracy: 91,
        lastUpdated: '2025-01-18T00:00:00Z'
      },
      {
        id: 3,
        name: 'Protocolo AVC',
        description: 'Acidente Vascular Cerebral',
        usage: 156,
        accuracy: 96,
        lastUpdated: '2025-01-12T00:00:00Z'
      }
    ]);
  });

  // ============================================
  // ANALYZE SYMPTOMS ENDPOINT
  // ============================================
  app.post('/api/analyze', (req, res) => {
    const { symptoms, age, sex, municipality } = req.body;

    // Simular análise baseada nos sintomas
    let condition = 'Condição não identificada';
    let confidence = 70;
    let riskLevel = 'medium';
    let recommendations = [];
    let redFlags = [];

    if (symptoms.includes('Dor torácica') || symptoms.includes('dor torácica')) {
      condition = 'Síndrome Coronariana Aguda';
      confidence = 85;
      riskLevel = 'high';
      recommendations = [
        'ECG de 12 derivações imediatamente',
        'Troponina seriada (0h, 1h, 3h)',
        'Aspirina 200mg VO imediatamente',
        'Considerar antiagregação dupla',
        'Monitorização contínua'
      ];
      redFlags = [
        'Dor torácica em repouso',
        'Fatores de risco cardiovascular'
      ];
    } else if (symptoms.includes('Dispneia') || symptoms.includes('dispneia')) {
      condition = 'Possível Pneumonia ou Insuficiência Cardíaca';
      confidence = 75;
      riskLevel = 'medium';
      recommendations = [
        'Ausculta pulmonar detalhada',
        'Saturação de oxigênio',
        'Raio-X de tórax',
        'Considerar gasometria arterial'
      ];
      redFlags = [
        'Dispneia em repouso',
        'Taquipneia'
      ];
    }

    res.json({
      condition,
      confidence,
      riskLevel,
      recommendations,
      redFlags,
      analyzedSymptoms: symptoms,
      patientData: { age, sex, municipality },
      timestamp: new Date().toISOString()
    });
  });

  // ============================================
  // AUTOMATION ENDPOINTS
  // ============================================
  app.get('/api/automation/pending', (req, res) => {
    res.json([
      {
        id: 1,
        patient: 'João Silva',
        task: 'Revisar ECG',
        priority: 'high',
        dueDate: '2025-01-22T12:00:00Z'
      },
      {
        id: 2,
        patient: 'Maria Costa',
        task: 'Avaliar Raio-X',
        priority: 'medium',
        dueDate: '2025-01-22T15:00:00Z'
      }
    ]);
  });

  app.get('/api/automation/metrics', (req, res) => {
    res.json({
      totalTasks: 45,
      completedTasks: 38,
      pendingTasks: 7,
      averageCompletionTime: '2.5 hours',
      efficiency: 84
    });
  });

  // ============================================
  // CARE CHAINS ENDPOINT
  // ============================================
  app.get('/api/care-chains', (req, res) => {
    res.json([
      {
        id: 1,
        name: 'Cadeia SCA',
        steps: ['Triagem', 'ECG', 'Laboratório', 'Intervenção'],
        activePatients: 3,
        averageTime: '45 min'
      },
      {
        id: 2,
        name: 'Cadeia AVC',
        steps: ['Triagem', 'TC Crânio', 'Neurologia', 'Terapia'],
        activePatients: 1,
        averageTime: '30 min'
      }
    ]);
  });

  // ============================================
  // ANALYTICS ENDPOINT
  // ============================================
  app.get('/api/analytics', (req, res) => {
    res.json({
      totalPatients: 234,
      averageStayTime: '3.2 days',
      readmissionRate: 8.5,
      satisfactionScore: 4.6,
      mostCommonConditions: [
        { name: 'SCA', count: 45 },
        { name: 'Pneumonia', count: 38 },
        { name: 'AVC', count: 32 }
      ]
    });
  });

  // ============================================
  // POPULATION DATA ENDPOINT
  // ============================================
  app.get('/api/population-data', (req, res) => {
    res.json({
      location: 'São Paulo - SP',
      population: 12400000,
      demographics: {
        ageGroups: [
          { range: '0-18', percentage: 22 },
          { range: '19-40', percentage: 35 },
          { range: '41-60', percentage: 28 },
          { range: '60+', percentage: 15 }
        ]
      },
      healthIndicators: {
        diabetesPrevalence: 8.4,
        hypertensionPrevalence: 24.1,
        obesityRate: 19.8
      },
      seasonalTrends: {
        respiratory: { current: 15, trend: 'up' },
        cardiovascular: { current: 24, trend: 'stable' },
        infectious: { current: 8, trend: 'down' }
      }
    });
  });

  // ============================================
  // BIAS ALERTS ENDPOINT
  // ============================================
  app.get('/api/bias-alerts', (req, res) => {
    res.json([
      {
        id: 1,
        type: 'confirmation',
        description: 'Viés de confirmação detectado em 2 casos esta semana',
        severity: 'medium',
        affectedCases: 2
      },
      {
        id: 2,
        type: 'anchoring',
        description: 'Possível viés de ancoragem em diagnósticos de pneumonia',
        severity: 'low',
        affectedCases: 1
      }
    ]);
  });
}
