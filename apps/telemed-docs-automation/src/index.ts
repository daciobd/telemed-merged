import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import generationRouter from './routes/generation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ DEFINA AS VARIÁVEIS PRIMEIRO
const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.json({ limit: '2mb' }));

// Servir arquivos estáticos da pasta telemed-deploy-ready
const staticPath = path.join(__dirname, '../../telemed-deploy-ready');
app.use(express.static(staticPath));

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

// Homepage - redireciona para o Hub
app.get('/', (req: express.Request, res: express.Response) => {
  res.sendFile(path.join(staticPath, 'example-integration.html'));
});

// API info endpoint
app.get('/api', (req: express.Request, res: express.Response) => {
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
app.get('/healthz', (_req: express.Request, res: express.Response) => res.json({ ok: true }));

// Proxy para contornar CORS dos serviços externos
app.get('/proxy/health/:service', async (req: express.Request, res: express.Response) => {
  const { service } = req.params;
  const urls: Record<string, string> = {
    'auction': 'https://telemed-auction.onrender.com/healthz',
    'productivity': 'https://telemed-productivity.onrender.com/healthz',
    'internal': 'https://telemed-internal.onrender.com/healthz'
  };

  const url = urls[service];
  if (!url) {
    return res.status(400).json({ ok: false, error: 'Service not found' });
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json({ ok: response.ok && data.ok, status: response.status, data });
  } catch (error) {
    res.json({ ok: false, error: String(error) });
  }
});

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
// ... (código existente das rotas de appointments)

// ✅ HEALTHCHECK DO DR. AI (cole aqui)
app.get('/api/dr-ai/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// ✅ FINALMENTE O app.listen() NO FINAL
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