// Integração do Medical Desk Advanced com o servidor principal
import express from 'express';

// Feature Flag para MDA
const MDA_ENABLED = process.env.MDA_ENABLED === 'true';
const MDA_SERVICE_URL = process.env.MDA_SERVICE_URL || 'http://localhost:8881';

// Mock endpoints quando MDA_ENABLED=false
const mockMDAResponses = {
  health: {
    ok: true,
    service: 'medical-desk-advanced-mock',
    status: 'disabled',
    message: 'MDA feature flag is disabled',
    ts: () => new Date().toISOString()
  },
  
  analyzeSymptoms: (symptoms: string[]) => ({
    success: false,
    error: 'feature_disabled',
    message: 'Medical Desk Advanced está desabilitado',
    mockData: {
      symptoms,
      triage: 'mock',
      recommendations: ['Consulta tradicional recomendada']
    },
    ts: new Date().toISOString()
  }),

  telemedicineSession: () => ({
    success: false,
    error: 'feature_disabled', 
    message: 'Telemedicina avançada não disponível',
    fallback: '/consulta/',
    ts: new Date().toISOString()
  })
};

export function setupMDAIntegration(app: express.Application) {
  console.log(`[MDA] Integration setup - Enabled: ${MDA_ENABLED}`);

  // Middleware para feature flag
  app.use('/api/mda', (req, res, next) => {
    if (!MDA_ENABLED) {
      // Log para debug
      console.log(`[MDA] Request blocked - feature disabled: ${req.method} ${req.path}`);
    }
    next();
  });

  // Health check sempre disponível (para monitoring)
  app.get('/api/mda/health', (req, res) => {
    if (!MDA_ENABLED) {
      return res.json({
        ...mockMDAResponses.health,
        ts: mockMDAResponses.health.ts()
      });
    }

    // TODO: Proxy para MDA real quando habilitado
    res.json({
      ok: true,
      service: 'medical-desk-advanced',
      status: 'enabled-but-proxy-needed',
      message: 'MDA habilitado, mas proxy não implementado ainda',
      ts: new Date().toISOString()
    });
  });

  // Análise de sintomas (mock quando desabilitado)
  app.post('/api/mda/ai/analyze-symptoms', express.json(), (req, res) => {
    if (!MDA_ENABLED) {
      const { symptoms = [] } = req.body;
      return res.status(503).json(mockMDAResponses.analyzeSymptoms(symptoms));
    }

    // TODO: Proxy para MDA real
    res.status(503).json({
      success: false,
      error: 'proxy_not_implemented',
      message: 'Proxy para MDA real ainda não implementado',
      ts: new Date().toISOString()
    });
  });

  // Sessões de telemedicina (mock quando desabilitado)
  app.post('/api/mda/telemedicine/sessions', express.json(), (req, res) => {
    if (!MDA_ENABLED) {
      return res.status(503).json(mockMDAResponses.telemedicineSession());
    }

    // TODO: Proxy para MDA real
    res.status(503).json({
      success: false,
      error: 'proxy_not_implemented', 
      message: 'Proxy para telemedicina avançada ainda não implementado',
      ts: new Date().toISOString()
    });
  });

  // Endpoint de configuração para frontend
  app.get('/api/mda/config', (req, res) => {
    res.json({
      enabled: MDA_ENABLED,
      features: {
        aiAnalysis: MDA_ENABLED,
        advancedTelemedicine: MDA_ENABLED,
        intelligentPrescription: MDA_ENABLED,
        realTimeMonitoring: MDA_ENABLED
      },
      endpoints: MDA_ENABLED ? {
        health: '/api/mda/health',
        aiAnalysis: '/api/mda/ai/analyze-symptoms',
        telemedicine: '/api/mda/telemedicine/sessions',
        websocket: '/ws-mda'
      } : null,
      fallbacks: {
        consultation: '/consulta/',
        prescription: '/generate/prescription'
      },
      ts: new Date().toISOString()
    });
  });

  console.log('[MDA] Integration routes configured:');
  console.log('  GET  /api/mda/health - Health check');
  console.log('  GET  /api/mda/config - Feature configuration');
  console.log('  POST /api/mda/ai/analyze-symptoms - IA analysis');
  console.log('  POST /api/mda/telemedicine/sessions - Advanced telemedicine');
  console.log(`  Mode: ${MDA_ENABLED ? 'ENABLED' : 'MOCK (disabled)'}`);
}