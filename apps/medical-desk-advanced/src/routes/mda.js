// Router principal do MDA com namespace /api/mda/*
import { Router } from 'express';
import { authMiddleware } from '../auth/jwt.js';

export const mda = Router();

// Health check público (sem autenticação)
mda.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    service: 'medical-desk-advanced',
    version: '1.0.0',
    ts: new Date().toISOString() 
  });
});

// Stats públicas do serviço
mda.get('/stats', (req, res) => {
  res.json({
    service: 'medical-desk-advanced',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    activeConnections: 0, // TODO: implementar contador real
    ts: new Date().toISOString()
  });
});

// A partir daqui, todas as rotas exigem JWT
mda.use(authMiddleware);

// === IA CLÍNICA ===
mda.post('/ai/analyze-symptoms', async (req, res) => {
  try {
    const { symptoms = [], patientAge, patientGender, urgency = false } = req.body;
    
    // Mock de análise de sintomas - substituir por IA real
    const mockAnalysis = {
      user: req.user?.sub ?? "unknown",
      inputCount: symptoms.length,
      triage: symptoms.includes("dor no peito") ? "alta" : 
              symptoms.includes("febre") ? "media" : "baixa",
      recommendations: [
        "Consulta presencial recomendada",
        "Exames laboratoriais sugeridos",
        "Monitoramento dos sintomas"
      ],
      confidence: Math.floor(Math.random() * 40) + 60, // 60-100%
      estimatedDuration: urgency ? 15 : 30, // minutos
      specialtyRecommended: symptoms.includes("dor no peito") ? "cardiologia" : "clinica-geral"
    };

    res.json({
      success: true,
      analysis: mockAnalysis,
      ts: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'analysis_failed', 
      message: error.message 
    });
  }
});

mda.post('/ai/intelligent-prescription', async (req, res) => {
  try {
    const { symptoms, diagnosis, patientProfile } = req.body;
    
    // Mock de prescrição inteligente
    const mockPrescription = {
      medications: [
        {
          name: "Paracetamol 500mg",
          dosage: "1 comprimido",
          frequency: "a cada 6 horas",
          duration: "7 dias",
          instructions: "Tomar com água, preferencialmente após as refeições"
        }
      ],
      warnings: [
        "Não exceder a dose recomendada",
        "Consultar médico se os sintomas persistirem"
      ],
      followUp: "Retorno em 7 dias se não houver melhora",
      generated: true,
      confidence: 85
    };

    res.json({
      success: true,
      prescription: mockPrescription,
      ts: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'prescription_failed', 
      message: error.message 
    });
  }
});

// === TELEMEDICINA AVANÇADA ===
mda.post('/telemedicine/sessions', async (req, res) => {
  try {
    const { consultationId, patientId } = req.body;
    
    // Mock de criação de sessão
    const sessionId = `mda-session-${Date.now()}`;
    const roomId = `room-${consultationId || 'temp'}`;
    
    const session = {
      id: sessionId,
      consultationId,
      roomId,
      status: 'waiting',
      joinUrl: `https://meet.jit.si/${roomId}`,
      startedAt: new Date().toISOString(),
      doctorId: req.user?.sub,
      patientId
    };

    res.json({
      success: true,
      session,
      ts: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'session_creation_failed', 
      message: error.message 
    });
  }
});

mda.patch('/telemedicine/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Mock de atualização de sessão
    res.json({
      success: true,
      updated: { id, status, notes, updatedAt: new Date().toISOString() },
      ts: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'session_update_failed', 
      message: error.message 
    });
  }
});

mda.post('/telemedicine/sessions/:id/finish', async (req, res) => {
  try {
    const { id } = req.params;
    const { summary, prescriptions, followUp } = req.body;
    
    // Mock de finalização de sessão
    res.json({
      success: true,
      finished: {
        sessionId: id,
        endedAt: new Date().toISOString(),
        summary,
        prescriptions,
        followUp,
        recordingAvailable: false
      },
      ts: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'session_finish_failed', 
      message: error.message 
    });
  }
});

// === CONSULTAS ===
mda.get('/consultations', async (req, res) => {
  try {
    const { status, limit = 10 } = req.query;
    
    // Mock de listagem de consultas
    const consultations = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      id: 100 + i,
      patientId: `patient-${i + 1}`,
      doctorId: req.user?.sub,
      status: status || 'active',
      symptoms: ['febre', 'dor de cabeça'],
      createdAt: new Date(Date.now() - i * 3600000).toISOString()
    }));

    res.json({
      success: true,
      consultations,
      count: consultations.length,
      ts: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'consultations_fetch_failed', 
      message: error.message 
    });
  }
});

mda.get('/consultations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock de consulta específica
    const consultation = {
      id: parseInt(id),
      patientId: `patient-${id}`,
      doctorId: req.user?.sub,
      status: 'active',
      symptoms: ['febre', 'dor de cabeça'],
      aiAnalysis: {
        triage: 'media',
        recommendations: ['Consulta presencial', 'Exames laboratoriais']
      },
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      consultation,
      ts: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'consultation_fetch_failed', 
      message: error.message 
    });
  }
});