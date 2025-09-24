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

// CORS: liberar apenas o frontend
app.use(cors({ 
  origin: ['https://telemed-deploy-ready.onrender.com'], 
  credentials: true,
  methods: ["GET","POST","PATCH","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Internal-Token"]
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

// Health Check: responder 200 OK em GET /api/health
app.get('/api/health', (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'ok', 
    service: process.env.SERVICE_NAME || 'telemed-docs-automation', 
    time: new Date().toISOString()
  });
});

// Manter /healthz para compatibilidade
app.get('/healthz', (_req: express.Request, res: express.Response) => res.json({ ok: true }));

// ===== Proxy de Avaliação (público, sem token) =====
app.use('/api/avaliacao-proxy', express.urlencoded({ extended: true }));
app.post('/api/avaliacao-proxy', async (req: express.Request, res: express.Response) => {
  const GOOGLE_APPS_SCRIPT_URL = process.env.EVALUATION_ENDPOINT;
  
  if (!GOOGLE_APPS_SCRIPT_URL) {
    console.error('❌ EVALUATION_ENDPOINT não configurado');
    return res.status(503).json({ ok: false, error: 'Serviço de avaliação não configurado' });
  }
  
  try {
    console.log('📝 Proxy avaliação recebida - campos:', Object.keys(req.body || {}).length);
    
    // Validar campos obrigatórios
    const required = ['role', 'facilidade_uso', 'clareza_fluxo', 'recurso_mais_util', 'nps', 'bugs_ou_erros'];
    const missing = required.filter(field => !req.body[field]);
    if (missing.length > 0) {
      return res.status(400).json({ ok: false, error: `Campos obrigatórios ausentes: ${missing.join(', ')}` });
    }
    
    // Converter dados para URLSearchParams
    const formParams = new URLSearchParams();
    Object.entries(req.body || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formParams.append(key, String(value));
      }
    });
    
    // Fazer requisição para Google Apps Script com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      body: formParams,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 Resposta upstream - Status:', response.status);
    
    // Tratar qualquer resposta 2xx como sucesso
    if (response.ok) {
      console.log('✅ Avaliação enviada com sucesso');
      res.json({ ok: true, message: 'Avaliação enviada com sucesso' });
    } else if (response.status === 401) {
      console.log('❌ Erro de autorização upstream - verificar configuração EVALUATION_ENDPOINT');
      res.status(502).json({ ok: false, error: 'Serviço de avaliação não autorizado - verificar configuração' });
    } else {
      console.log('❌ Erro upstream - Status:', response.status);
      res.status(502).json({ ok: false, error: 'Erro no serviço de avaliação' });
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('⏰ Timeout no proxy de avaliação');
      res.status(504).json({ ok: false, error: 'Timeout ao enviar avaliação' });
    } else {
      console.error('❌ Erro no proxy de avaliação:', error?.message || error);
      res.status(500).json({ ok: false, error: 'Falha ao enviar avaliação' });
    }
  }
});

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
  
  console.log('[TeleMed] Proxy request to RC');
  console.log('[TeleMed] RC_BASE:', RC_BASE);
  console.log('[TeleMed] Token present:', !!INTERNAL_TOKEN, 'length:', INTERNAL_TOKEN?.length || 0);
  console.log('[TeleMed] Request body:', JSON.stringify(req.body));
  
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
    
    console.log('[TeleMed] RC response status:', r.status);
    console.log('[TeleMed] RC response headers:', Object.fromEntries(r.headers.entries()));
    
    const data = await r.json().catch(() => ({}));
    console.log('[TeleMed] RC response data:', data);
    
    res.status(r.status).json(data);
  } catch (e: any) {
    console.error('Error proxying to ReceitaCerta:', e);
    res.status(502).json({ error: 'Bad Gateway to Receita Certa' });
  }
});

// In-memory storage for drafts (usar banco real em produção)
const drafts = new Map();

// Mock data para PHR
const mockPHRData = {
  'PAT-123': {
    patient: { name: 'João Silva', age: 54, sex: 'Masculino', phone: '(11) 99999-9999' },
    consultations: [
      { date: '2024-01-15', doctor: 'Dr. Maria Santos', diagnosis: 'Hipertensão arterial', notes: 'Pressão controlada' },
      { date: '2024-01-10', doctor: 'Dr. Pedro Lima', diagnosis: 'Consulta de rotina', notes: 'Exames em dia' }
    ],
    exams: [
      { date: '2024-01-12', type: 'Hemograma completo', result: 'Normal', doctor: 'Dr. Ana Costa' },
      { date: '2024-01-08', type: 'Radiografia de tórax', result: 'Sem alterações', doctor: 'Dr. Carlos Souza' }
    ],
    allergies: ['Penicilina', 'Dipirona'],
    meds: [
      { name: 'Losartana 50mg', frequency: '1x/dia', duration: 'Uso contínuo' },
      { name: 'Sinvastatina 20mg', frequency: '1x/dia à noite', duration: 'Uso contínuo' }
    ]
  }
};

// === ROTAS DE AUTOSAVE ===
app.patch('/api/consultations/:id/draft', (req: express.Request, res: express.Response) => {
  const consultationId = req.params.id;
  const draftKey = `${consultationId}`;
  drafts.set(draftKey, { ...req.body, savedAt: new Date().toISOString() });
  
  console.log(`📝 Draft saved for consultation ${consultationId}`);
  
  res.status(200).json({ ok: true, savedAt: new Date().toISOString() });
});

app.post('/api/consultations/:id/draft/beacon', (req: express.Request, res: express.Response) => {
  const consultationId = req.params.id;
  
  console.log(`🚨 Beacon draft received for consultation ${consultationId}`);
  
  // Processar fila de drafts
  if (Array.isArray(req.body)) {
    req.body.forEach((draft: any, idx: number) => {
      const draftKey = `${consultationId}_beacon_${idx}`;
      drafts.set(draftKey, { ...draft, savedAt: new Date().toISOString() });
    });
  }
  
  res.status(200).json({ ok: true, processed: Array.isArray(req.body) ? req.body.length : 1 });
});

// === ROTA PHR ===
app.get('/api/patients/:id/phr', (req: express.Request, res: express.Response) => {
  const patientId = req.params.id;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const phrData = mockPHRData[patientId as keyof typeof mockPHRData];
  if (!phrData) {
    return res.status(404).json({ ok: false, error: 'Patient not found' });
  }
  
  // Simular auditoria
  console.log(`👁️ PHR viewed for patient ${patientId}`);
  
  // Limitar resultados
  const limitedData = {
    ...phrData,
    consultations: phrData.consultations.slice(0, limit),
    exams: phrData.exams.slice(0, limit)
  };
  
  res.status(200).json(limitedData);
});

// === ROTA DE EVENTOS (telemetria) ===
app.post('/api/events', (req: express.Request, res: express.Response) => {
  console.log(`📊 Event: ${req.body.type} - ${JSON.stringify(req.body)}`);
  res.status(200).json({ ok: true });
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  // Logs: logar ao subir: serviço, porta e env essencial presente
  console.log(`🚀 Starting TeleMed Docs Automation Service (TypeScript)...`);
  console.log(`[${process.env.SERVICE_NAME || 'telemed-docs-automation'}] listening on :${PORT}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: PORT,
    CORS_ORIGINS: 'telemed-deploy-ready.onrender.com',
    INTERNAL_TOKEN: process.env.INTERNAL_TOKEN ? 'configured' : 'NOT SET',
    S3_BUCKET: process.env.S3_BUCKET || 'not configured'
  });
});