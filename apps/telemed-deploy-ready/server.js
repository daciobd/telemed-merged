const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Environment variables for MedicalDesk
const FEAT_MD = String(process.env.FEATURE_MEDICALDESK || 'false').toLowerCase() === 'true';
const MD_BASE = process.env.MEDICALDESK_URL || '';
const JWT_SECRET = process.env.JWT_SECRET || 'telemed-dev-secret-2025';

// Environment variables for Pricing/Auction
const FEATURE_PRICING = String(process.env.FEATURE_PRICING ?? 'true') === 'true';
const AUCTION_SERVICE_URL = process.env.AUCTION_SERVICE_URL || 'http://localhost:5001/api';

// Health check endpoint for Render observability
app.get(['/api/health', '/healthz'], (req, res) => {
  res.json({ 
    ok: true, 
    service: 'telemed-frontend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Auth API endpoints (existing)
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

// ==== MedicalDesk Integration Endpoints ====

// (a) Feature flag endpoint
app.get('/api/medicaldesk/feature', (req, res) => {
  res.json({
    feature: FEAT_MD,
    hasBase: !!MD_BASE
  });
});

// (b) Create JWT session and return launch URL
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

    // Create JWT token
    const token = jwt.sign(
      { 
        sub: String(doctorId), 
        patientId: String(patientId), 
        role: 'doctor' 
      },
      JWT_SECRET,
      { expiresIn: '15m', issuer: 'telemed' }
    );

    // Launch URL via proxy (no CORS)
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

// (c) Proxy to real MedicalDesk service (avoids CORS)
if (FEAT_MD && MD_BASE) {
  app.use('/medicaldesk', createProxyMiddleware({
    target: MD_BASE,
    changeOrigin: true,
    secure: true,
    logLevel: 'warn',
    pathRewrite: { '^/medicaldesk': '' }, // /medicaldesk/app -> /app
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader('X-From-TeleMed', 'true');
    },
    onError: (err, req, res) => {
      console.error('[MedicalDesk Proxy Error]', err.message);
      res.status(502).json({ 
        ok: false, 
        error: 'Serviço MedicalDesk indisponível' 
      });
    }
  }));
}

// ==== Dr. AI Endpoints (DEMO mode) ====

// Demo AI handler - responde tanto GET quanto POST
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

// Aceita GET/POST em /api/ai/answer e /api/ai/ask
app.all('/api/ai/answer', demoAiHandler);
app.all('/api/ai/ask', demoAiHandler);

// Health check opcional para Dr. AI
app.get('/api/ai/health', (_, res) => res.json({ ok: true, service: 'dr-ai-demo' }));

// ==== Feature Flags Endpoint ====
app.get('/config.js', (req, res) => {
  res.type('application/javascript').send(
    `window.TELEMED_CFG = {
      FEATURE_PRICING: ${FEATURE_PRICING},
      AUCTION_URL: '/api/auction'
    };`
  );
});

// ==== Auction/Pricing Proxy ====
if (FEATURE_PRICING) {
  app.use('/api/auction', createProxyMiddleware({
    target: AUCTION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/auction': '' },
    proxyTimeout: 15000,
    timeout: 20000,
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader('X-From-TeleMed', 'true');
    },
    onError: (err, req, res) => {
      console.error('[Auction Proxy Error]', err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'auction_service_unavailable' });
      }
    }
  }));
} else {
  app.all('/api/auction/*', (req, res) => {
    res.status(503).json({ error: 'pricing_feature_disabled' });
  });
}

// Static file serving
app.use(express.static(process.cwd(), {
  extensions: ['html'],
  index: 'index.html'
}));

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`🩺 TeleMed server running on port ${port}`);
  console.log(`📊 MedicalDesk feature: ${FEAT_MD ? 'ENABLED' : 'DISABLED'}`);
  if (FEAT_MD && MD_BASE) {
    console.log(`🔗 MedicalDesk proxy: ${MD_BASE}`);
  }
  console.log(`💰 Pricing/Auction feature: ${FEATURE_PRICING ? 'ENABLED' : 'DISABLED'}`);
  if (FEATURE_PRICING) {
    console.log(`🔗 Auction proxy: /api/auction → ${AUCTION_SERVICE_URL}`);
  }
});
