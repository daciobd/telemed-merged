#!/usr/bin/env node

import express from 'express';
import { join } from 'path';
import jwt from 'jsonwebtoken';

process.on('unhandledRejection', (e) => { console.error(e); process.exit(1); });

const PORT = String(process.env.PORT || 5000);

// Se DR_AI estiver habilitado mas sem chave, desabilita para não quebrar o boot
if (process.env.DR_AI_ENABLED === '1' && !process.env.OPENAI_API_KEY) {
  console.warn('[boot] DR_AI_ENABLED=1 mas sem OPENAI_API_KEY → desabilitando Dr. AI');
  process.env.DR_AI_ENABLED = '0';
}

console.log(`[boot] Starting TeleMed production server on port ${PORT}`);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Environment variables
const FEAT_MD = String(process.env.FEATURE_MEDICALDESK || 'false').toLowerCase() === 'true';
const MD_BASE = process.env.MEDICALDESK_URL || '';
const JWT_SECRET = process.env.JWT_SECRET || 'telemed-dev-secret-2025';
const FEATURE_PRICING = String(process.env.FEATURE_PRICING ?? 'true') === 'true';

// Health check endpoint
app.get(['/api/health', '/healthz'], (req, res) => {
  res.json({ 
    ok: true, 
    service: 'telemed-production',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Auth API endpoints
app.post('/api/auth/login', (req, res) => {
  const { id, password, role } = req.body;
  
  if (!id || !password || !role) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }
  
  const user = { id, role, name: role === 'medico' ? 'Dr(a). Teste' : 'Paciente Teste' };
  const token = Buffer.from(JSON.stringify({ 
    sub: id, 
    role, 
    exp: Date.now() + 24*60*60*1000 
  })).toString('base64');
  
  res.json({ ok: true, token, user });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ ok: true, user: null });
});

// MedicalDesk Integration Endpoints
app.get('/api/medicaldesk/feature', (req, res) => {
  res.json({
    feature: FEAT_MD,
    hasBase: !!MD_BASE
  });
});

app.post('/api/medicaldesk/session', (req, res) => {
  try {
    if (!FEAT_MD || !MD_BASE) {
      return res.status(503).json({ 
        ok: false, 
        error: 'MedicalDesk desabilitado' 
      });
    }

    const { patientId, doctorId } = req.body || {};
    if (!patientId || !doctorId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'patientId e doctorId são obrigatórios' 
      });
    }

    const token = jwt.sign(
      { 
        sub: String(doctorId), 
        patientId: String(patientId), 
        role: 'doctor' 
      },
      JWT_SECRET,
      { expiresIn: '15m', issuer: 'telemed' }
    );

    const launchUrl = `/medicaldesk/app?token=${encodeURIComponent(token)}`;
    
    return res.json({ ok: true, launchUrl });
  } catch (e) {
    console.error('[medicaldesk/session] erro', e);
    return res.status(500).json({ 
      ok: false, 
      error: 'Falha ao criar sessão' 
    });
  }
});

// MedicalDesk Proxy placeholder
if (FEAT_MD && MD_BASE) {
  console.log('[boot] MedicalDesk configured - proxy requires external service');
}

// Dr. AI Endpoints (DEMO mode)
const demoAiHandler = (req, res) => {
  const q =
    (req.body && (req.body.question || req.body.q)) ||
    req.query.q ||
    'pergunta de teste';

  res.json({
    ok: true,
    answer: `Resposta DEMO para: "${q}".\n(IA simulada localmente)`,
    traceId: String(Date.now())
  });
};

app.all('/api/ai/answer', demoAiHandler);
app.all('/api/ai/ask', demoAiHandler);
app.get('/api/ai/health', (_, res) => res.json({ ok: true, service: 'dr-ai-demo' }));

// Feature Flags Endpoint
app.get('/config.js', (req, res) => {
  res.type('application/javascript').send(
    `window.TELEMED_CFG = {
      FEATURE_PRICING: ${FEATURE_PRICING},
      AUCTION_URL: '/api/auction'
    };`
  );
});

// Static file serving from telemed-deploy-ready
const staticPath = join(process.cwd(), 'apps', 'telemed-deploy-ready');
app.use(express.static(staticPath, {
  extensions: ['html'],
  index: 'index.html'
}));

// Fallback to index.html for SPA routes
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    res.sendFile(join(staticPath, 'index.html'));
  } else {
    next();
  }
});

// Graceful shutdown
function setupGracefulShutdown(server) {
  const shutdown = (signal) => {
    console.log(`\n[boot] Received ${signal}, shutting down gracefully...`);
    server.close(() => {
      console.log('[boot] Server closed');
      process.exit(0);
    });
    
    setTimeout(() => {
      console.log('[boot] Force exit after timeout');
      process.exit(0);
    }, 5000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

const server = app.listen(parseInt(PORT), '0.0.0.0', () => {
  console.log(`🩺 TeleMed production server running on port ${PORT}`);
  console.log(`📊 MedicalDesk feature: ${FEAT_MD ? 'ENABLED' : 'DISABLED'}`);
  console.log(`💰 Pricing/Auction feature: ${FEATURE_PRICING ? 'ENABLED' : 'DISABLED'}`);
});

setupGracefulShutdown(server);
