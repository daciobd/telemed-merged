import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import generationRouter from './routes/generation.js';

const app = express();
app.use(express.json({ limit: '2mb' }));

// CORS configurável por env
const ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ 
  origin: ORIGINS.length ? ORIGINS : true,
  methods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Internal-Token"],
  credentials: false
}));

app.use(morgan('combined'));

// Homepage
app.get('/', (req, res) => {
  res.json({
    service: 'TeleMed Docs Automation',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      'GET /healthz': 'Health check',
      'POST /generate/prescription': 'Generate prescription (requires X-Internal-Token)',
      'POST /generate/attestation': 'Generate attestation (requires X-Internal-Token)'
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: process.env.PORT || '8080',
      CORS_ORIGINS: process.env.CORS_ORIGINS || 'all',
      S3_CONFIGURED: !!process.env.AWS_ACCESS_KEY_ID,
      INTERNAL_TOKEN_SET: !!process.env.INTERNAL_TOKEN
    }
  });
});

// Healthcheck padronizado
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Middleware simples de auth interna por token
function requireInternalToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const configured = process.env.INTERNAL_TOKEN;
  if (!configured) return res.status(500).json({ ok: false, error: 'INTERNAL_TOKEN not set' });
  const token = req.get('x-internal-token');
  if (token !== configured) return res.status(401).json({ ok: false, error: 'unauthorized' });
  next();
}

// Proteger rotas de geração/notify
app.use('/generate', requireInternalToken, generationRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[telemed-docs-automation] listening on :${PORT}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT,
    CORS_ORIGINS: ORIGINS.join(',') || 'all',
    INTERNAL_TOKEN: process.env.INTERNAL_TOKEN ? 'configured' : 'NOT SET',
    S3_BUCKET: process.env.S3_BUCKET || 'not configured'
  });
});