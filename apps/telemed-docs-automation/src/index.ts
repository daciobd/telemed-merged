import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import generationRouter from './routes/generation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Rota específica para health check do ReceitaCerta
app.get('/rc/health', async (_req: express.Request, res: express.Response) => {
  const base = (process.env.VITE_RC_BASE_URL || process.env.RC_BASE_URL || 'https://receita-certa-daciobd.replit.app').replace(/\/$/, '');
  
  try {
    const r = await fetch(`${base}/api/health`);
    const data = await r.json().catch(() => ({}));
    res.status(r.ok ? 200 : 500).json(data);
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'rc_unreachable' });
  }
});

// PROXY de criação de receita (injeta o token com segurança)
app.post('/api/rc/prescriptions', async (req: express.Request, res: express.Response) => {
  const RC_BASE = (process.env.VITE_RC_BASE_URL || process.env.RC_BASE_URL || 'https://receita-certa-daciobd.replit.app').replace(/\/$/, '');
  const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;
  
  if (!INTERNAL_TOKEN) {
    return res.status(500).json({ error: 'INTERNAL_TOKEN not configured' });
  }
  
  try {
    const r = await fetch(`${RC_BASE}/api/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN
      },
      body: JSON.stringify(req.body),
    });
    const data = await r.json().catch(() => ({}));
    res.status(r.status).json(data);
  } catch (e: any) {
    console.error('Error proxying to ReceitaCerta:', e);
    res.status(502).json({ error: 'Bad Gateway to Receita Certa' });
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