const express = require('express');
const path = require('path');

const PORT = parseInt(process.env.PORT || '5000', 10);
const app = express();

// Start server FIRST to open port quickly
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🩺 TeleMed running on port ${PORT}`);
});

app.use(express.json());

// Health check - priority endpoint
app.get(['/api/health', '/healthz', '/health'], (req, res) => {
  res.json({ 
    ok: true, 
    service: 'telemed-production',
    timestamp: new Date().toISOString()
  });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { id, password, role } = req.body || {};
  if (!id || !password || !role) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }
  const token = Buffer.from(JSON.stringify({ sub: id, role, exp: Date.now() + 86400000 })).toString('base64');
  res.json({ ok: true, token, user: { id, role, name: role === 'medico' ? 'Dr(a). Teste' : 'Paciente Teste' } });
});

app.post('/api/auth/logout', (req, res) => res.json({ ok: true }));
app.get('/api/auth/me', (req, res) => res.json({ ok: true, user: null }));

// MedicalDesk
app.get('/api/medicaldesk/feature', (req, res) => {
  res.json({ feature: false, hasBase: false });
});

// Dr. AI Demo
app.all('/api/ai/answer', (req, res) => {
  const q = req.body?.question || req.body?.q || req.query?.q || 'teste';
  res.json({ ok: true, answer: `Resposta DEMO: "${q}"`, traceId: String(Date.now()) });
});
app.all('/api/ai/ask', (req, res) => {
  const q = req.body?.question || req.body?.q || req.query?.q || 'teste';
  res.json({ ok: true, answer: `Resposta DEMO: "${q}"`, traceId: String(Date.now()) });
});
app.get('/api/ai/health', (req, res) => res.json({ ok: true, service: 'dr-ai-demo' }));

// Config
app.get('/config.js', (req, res) => {
  res.type('application/javascript').send('window.TELEMED_CFG = { FEATURE_PRICING: true, AUCTION_URL: "/api/auction" };');
});

// Static files
const staticPath = path.join(process.cwd(), 'apps', 'telemed-deploy-ready');
app.use(express.static(staticPath, { extensions: ['html'], index: 'index.html' }));

// SPA fallback
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    res.sendFile(path.join(staticPath, 'index.html'));
  } else {
    next();
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close(() => process.exit(0));
});
