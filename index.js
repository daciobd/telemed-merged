// TeleMed Docs Automation Service - Standalone
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();

// CORS configurável por env
const ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({ 
  origin: ORIGINS.length ? ORIGINS : true,
  methods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Internal-Token"],
  credentials: false
}));

app.use(express.json({ limit: '2mb' }));
app.use(morgan('tiny'));

// Healthcheck padronizado
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Auth middleware simples
function requireInternalToken(req, res, next) {
  const configured = process.env.INTERNAL_TOKEN || 'change-me-internal';
  const token = req.get('x-internal-token');
  if (token !== configured) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  next();
}

// Rotas de geração (simplificadas para MVP)
app.post('/generate/prescription', requireInternalToken, (req, res) => {
  console.log('[prescription] payload:', JSON.stringify(req.body, null, 2));
  
  const mockDoc = {
    id: `pres_${Date.now()}`,
    kind: 'prescription',
    filename: `prescription_${Date.now()}.pdf`,
    pdfPath: '/tmp/prescription.pdf',
    metadata: { consultationId: req.body.summary?.consultationId || 'test' }
  };
  
  res.json({ 
    ok: true, 
    doc: mockDoc, 
    receitaCerta: { ok: false, message: 'Mock mode' }
  });
});

app.post('/generate/attestation', requireInternalToken, (req, res) => {
  console.log('[attestation] payload:', JSON.stringify(req.body, null, 2));
  
  const mockDoc = {
    id: `att_${Date.now()}`,
    kind: 'attestation', 
    filename: `attestation_${Date.now()}.pdf`,
    pdfPath: '/tmp/attestation.pdf',
    metadata: { consultationId: req.body.summary?.consultationId || 'test' }
  };
  
  res.json({ ok: true, doc: mockDoc });
});

app.post('/generate/notify', requireInternalToken, (req, res) => {
  console.log('[notify] patient:', req.body.patient);
  console.log('[notify] message:', req.body.message);
  console.log('[notify] attachment:', req.body.attachmentUrl);
  
  res.json({ ok: true, message: 'Notification logged (mock mode)' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[telemed-docs-automation] listening on :${PORT}`);
  console.log('Environment:', {
    CORS_ORIGINS: process.env.CORS_ORIGINS || 'not set',
    INTERNAL_TOKEN: process.env.INTERNAL_TOKEN ? 'set' : 'using default'
  });
});