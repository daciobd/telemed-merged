import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import crypto from 'crypto';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import consultorioRoutes from './consultorio-routes.js';
import seedRoutes from './routes/seed.routes.js';
import statsRoutes from './routes/stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// TelemedMerged: Feature flags e configurações
const FEATURE_PRICING = String(process.env.FEATURE_PRICING ?? 'true') === 'true';
const AUCTION_SERVICE_URL = process.env.AUCTION_SERVICE_URL || 'http://localhost:5001/api';

app.set('trust proxy', 1);

// CORS - Permitir qualquer origem (para testes)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));

// NÃO aplicar express.json() globalmente - causa problema com proxy!
// Será aplicado seletivamente após os proxies

// Security headers middleware
app.use((req, res, next) => {
  // Não aplicar headers restritivos para arquivos estáticos (CSS, JS, imagens)
  const isStaticFile = /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(req.path);
  
  if (!isStaticFile) {
    // CSP permissivo para HTML (permite CSS/JS inline e do mesmo origin)
    res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https:; img-src 'self' data: https:;");
    // HSTS
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    // Prevent MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Prevent clickjacking (SAMEORIGIN permite iframes do mesmo domínio)
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Remove server signature
    res.removeHeader('X-Powered-By');
    // No cache para HTML/API
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  } else {
    // Cache agressivo para arquivos estáticos (1 ano)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

// RequestId middleware para rastreabilidade
app.use((req, res, next) => { 
  // Aceita incoming x-request-id ou gera novo UUID
  req.id = req.header('x-request-id') || req.header('X-Request-ID') || randomUUID(); 
  res.setHeader('X-Request-ID', req.id);
  next(); 
});
const prisma = new PrismaClient();
// Força porta 5000 conforme configuração do .replit (waitForPort = 5000)
const PORT = 5000;

// Health check endpoints para observabilidade (PÚBLICO - sem auth)
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Health detalhado do gateway com feature flags
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'telemed-internal',
    feature_pricing: FEATURE_PRICING,
    auction_target: AUCTION_SERVICE_URL,
    timestamp: new Date().toISOString(),
  });
});

// Padronizado: /api/health
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: process.env.SERVICE_NAME || 'telemed-internal',
    time: new Date().toISOString()
  });
});

// Status JSON para monitores externos (UptimeRobot/Pingdom)
app.get('/status.json', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Testar conectividade do banco
    let dbStatus = 'unknown';
    let dbResponseTime = 0;
    
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStart;
      dbStatus = dbResponseTime < 1000 ? 'healthy' : 'slow';
    } catch (dbError) {
      dbStatus = 'unhealthy';
      console.error('Database health check failed:', dbError.message);
    }
    
    // Testar OpenAI (se configurado)
    let aiStatus = 'unknown';
    let aiResponseTime = 0;
    
    if (process.env.OPENAI_API_KEY) {
      try {
        const aiStart = Date.now();
        await openai.models.list();
        aiResponseTime = Date.now() - aiStart;
        aiStatus = aiResponseTime < 3000 ? 'healthy' : 'slow';
      } catch (aiError) {
        aiStatus = 'unhealthy';
        console.warn('OpenAI health check failed:', aiError.message);
      }
    } else {
      aiStatus = 'not_configured';
    }
    
    // Determinar status geral
    const totalResponseTime = Date.now() - startTime;
    let overallStatus = 'healthy';
    
    if (dbStatus === 'unhealthy') {
      overallStatus = 'unhealthy';
    } else if (dbStatus === 'slow' || aiStatus === 'slow' || totalResponseTime > 5000) {
      overallStatus = 'degraded';
    }
    
    const statusResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: {
        name: 'telemed-internal',
        version: '1.0.0',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      },
      components: {
        database: {
          status: dbStatus,
          response_time_ms: dbResponseTime
        },
        openai: {
          status: aiStatus,
          response_time_ms: aiResponseTime
        },
        server: {
          status: 'healthy',
          memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          cpu_usage: process.cpuUsage()
        }
      },
      metrics: {
        total_response_time_ms: totalResponseTime,
        requests_handled: 'N/A', // Seria implementado com contador
        errors_last_hour: 'N/A'  // Seria implementado com métricas
      }
    };
    
    // Log para auditoria
    await prisma.auditLog.create({
      data: {
        traceId: req.id,
        eventType: 'health_check_external',
        category: 'system',
        level: overallStatus === 'healthy' ? 'INFO' : 'WARN',
        payload: {
          overall_status: overallStatus,
          db_status: dbStatus,
          ai_status: aiStatus,
          response_time_ms: totalResponseTime
        },
        userAgent: req.get('User-Agent') || 'unknown',
        ipHash: 'monitor'
      }
    }).catch(err => {
      console.warn('Failed to log health check:', err.message);
    });
    
    // Retornar status HTTP apropriado
    const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 206 : 503;
    res.status(httpStatus).json(statusResponse);
    
  } catch (error) {
    console.error('Status endpoint failed:', error.message);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Internal server error',
      service: {
        name: 'telemed-internal',
        version: '1.0.0'
      }
    });
  }
});

// ===== TelemedMerged: Feature Flags Endpoint =====
app.get('/config.js', (_req, res) => {
  res.type('application/javascript').send(
    `window.TELEMED_CFG = {
      FEATURE_PRICING: ${FEATURE_PRICING},
      AUCTION_URL: '/api/auction'
    };`
  );
});

// ===== TelemedMerged: Auction Proxy =====

// Proxy reverso para o serviço de auction/leilão
// Roteamento condicional:
// - USE_LOCAL_AUCTION_MOCK=true → proxy para mock standalone (localhost:MOCK_PORT)
// - USE_LOCAL_AUCTION_MOCK=false → proxy para serviço real (AUCTION_URL)

const USE_LOCAL_AUCTION_MOCK = process.env.USE_LOCAL_AUCTION_MOCK === 'true';
const MOCK_PORT = process.env.MOCK_PORT || 3333;
const AUCTION_TARGET = USE_LOCAL_AUCTION_MOCK 
  ? `http://localhost:${MOCK_PORT}`
  : AUCTION_SERVICE_URL;

app.use('/api/auction', (req, res, next) => {
  console.log(`[AUCTION PROXY] ${req.method} ${req.originalUrl} → ${AUCTION_TARGET}`);
  
  // Feature flag: bloqueia tudo se desligado
  if (!FEATURE_PRICING) {
    return res.status(503).json({ error: 'pricing_disabled' });
  }
  next();
}, createProxyMiddleware({
  target: AUCTION_TARGET,
  changeOrigin: true,
  pathRewrite: { '^/': '/api/auction/' }, // Adiciona prefixo de volta (/bids → /api/auction/bids)
  proxyTimeout: 15000,
  timeout: 20000,
  onProxyReq: (proxyReq, req, _res) => {
    console.log(`[AUCTION PROXY REQ] ${req.method} ${req.originalUrl} → ${proxyReq.host}${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, _res) => {
    console.log(`[AUCTION PROXY RES] ${req.method} ${req.originalUrl} ← ${proxyRes.statusCode}`);
  },
  onError: (err, _req, res) => {
    console.error('[Auction Proxy Error]', err.message);
    if (!res.headersSent) {
      res.status(502).json({ 
        error: 'auction_service_unavailable', 
        details: err.message,
        target: AUCTION_TARGET
      });
    }
  },
  logLevel: 'debug'
}));

console.log(`💰 Auction proxy: /api/auction → ${AUCTION_TARGET}`);
console.log(`   Mode: ${USE_LOCAL_AUCTION_MOCK ? 'MOCK STANDALONE' : 'REAL SERVICE'}`);
console.log(`   Feature enabled: ${FEATURE_PRICING}`);

// ===== JSON BODY PARSER (após proxies) =====
// Agora que os proxies foram montados, podemos parsear JSON
// para as demais rotas sem interferir no proxy
app.use(express.json());

// ============================================
// CONSULTÓRIO VIRTUAL API ENDPOINTS
// ============================================

// Rotas do Consultório Virtual (autenticação, médicos, consultas)
app.use('/api/consultorio', consultorioRoutes);

// Rotas de Stats (Manager Dashboard)
app.use('/api/consultorio', statsRoutes);

// Importar rotas de Virtual Office (agendamento direto, página pública, etc)
const { default: virtualOfficeRoutes } = await import('./virtual-office.routes.js');
app.use('/api/virtual-office', virtualOfficeRoutes);

console.log('✅ Rotas do Consultório Virtual carregadas em /api/consultorio/*');
console.log('✅ Rotas de Stats carregadas em /api/consultorio/stats');
console.log('✅ Rotas de Virtual Office carregadas em /api/virtual-office/*');

// Rotas de Telemetria e Funil (Marketing/Analytics)
const { default: telemetryRoutes } = await import('./routes/telemetry.routes.js');
const { default: funnelRoutes } = await import('./routes/funnel.routes.js');
const { default: retargetRoutes } = await import('./routes/retarget.routes.js');

app.use('/api/telemetry', telemetryRoutes);
app.use('/metrics/v2', funnelRoutes);
app.use('/api/internal/retarget', retargetRoutes);

// ===== ENDPOINT INTERNO: Confirmar Pagamento =====
app.post('/api/internal/payments/confirm', async (req, res) => {
  try {
    const internalToken = req.headers['x-internal-token'];
    if (internalToken !== process.env.INTERNAL_TOKEN) {
      return res.status(401).json({ error: 'invalid_token' });
    }

    const { consultationId } = req.body ?? {};
    const id = Number(consultationId);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: 'missing_or_invalid_consultationId' });
    }

    const { pool } = await import('./db/pool.js');

    const pay = await pool.query(
      `UPDATE payments SET status = 'paid', paid_at = now()
       WHERE consultation_id = $1 AND status = 'pending'
       RETURNING id, consultation_id, status, paid_at, amount`,
      [id]
    );

    if (pay.rowCount === 0) {
      return res.status(404).json({ error: 'payment_not_found_or_not_pending' });
    }

    const cons = await pool.query(
      `UPDATE consultations SET status = 'scheduled'
       WHERE id = $1 AND status = 'pending'
       RETURNING id, status, scheduled_for`,
      [id]
    );

    return res.json({
      ok: true,
      payment: pay.rows[0],
      consultation: cons.rows[0] ?? null,
    });
  } catch (err) {
    console.error('Error confirming payment:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

console.log('📊 Rotas de Telemetria carregadas em /api/telemetry/*');
console.log('📈 Rotas de Funil carregadas em /metrics/v2/*');
console.log('🔄 Rotas de Retargeting carregadas em /api/internal/retarget/*');
console.log('💳 Rota de Pagamentos carregada em /api/internal/payments/*');

// Rotas de CAC e Experiments (após as rotas básicas)
try {
  const { default: cacRoutes } = await import('./routes/cac.routes.js');
  const { default: experimentsRoutes } = await import('./routes/experiments.routes.js');
  
  app.use('/metrics/v2/marketing', cacRoutes);
  app.use('/api/experiments', experimentsRoutes);
  
  console.log('💰 Rotas de CAC carregadas em /metrics/v2/marketing/*');
  console.log('🧪 Rotas de Experiments carregadas em /api/experiments/*');
} catch (err) {
  console.error('❌ Erro ao carregar rotas de CAC/Experiments:', err.message, err.stack);
}

// Rotas de Marketing Spend (gerenciamento de gastos com ads)
// NOTA: Rotas carregadas via index.js raiz

// ===== ENDPOINT DE DIAGNÓSTICO (opcional) =====
// Permite testar comunicação direta com o downstream BidConnect
app.post('/_diag/auction/bids', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const targetUrl = (AUCTION_SERVICE_URL || '').replace(/\/$/, '') + '/bids';
    
    console.log(`[DIAG] Testing direct fetch to: ${targetUrl}`);
    
    const r = await fetch(targetUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': req.headers.authorization || '' 
      },
      body: JSON.stringify(req.body)
    });
    
    const text = await r.text();
    const safeJson = (txt) => { 
      try { return JSON.parse(txt); } 
      catch { return { raw: txt }; } 
    };
    
    res.status(r.status).json({ 
      passthroughStatus: r.status, 
      response: safeJson(text),
      url: targetUrl
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== MEDICALDESK ENDPOINTS (ANTES DO PROXY!) =====

// Abrir MedicalDesk com redirect 302 (SOLUÇÃO ROBUSTA - sem popup, sem JS)
app.get('/go/medicaldesk', async (req, res) => {
  try {
    const feature = String(process.env.FEATURE_MEDICALDESK || '').toLowerCase() === 'true';
    const baseOk = !!process.env.MEDICALDESK_URL;
    
    if (!feature || !baseOk) {
      return res.status(503).send('MedicalDesk desabilitado');
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).send('Configuração inválida');
    }

    // Aceita query params ou usa defaults
    const patientId = req.query.patientId || 'paciente-test';
    const doctorId = req.query.doctorId || 'medico-demo';

    // Gera token JWT
    const token = jwt.sign(
      { sub: String(doctorId), patientId: String(patientId), role: 'doctor' },
      process.env.JWT_SECRET,
      { expiresIn: '15m', issuer: 'telemed' }
    );

    // LaunchUrl na raiz (será redirecionado para /app automaticamente)
    const launchUrl = `/medicaldesk/?token=${encodeURIComponent(token)}`;

    // (opcional) Pre-warm: acorda servidor/assets antes do redirect
    try {
      await fetch(`${req.protocol}://${req.get('host')}/medicaldesk/health`).catch(() => {});
    } catch (e) {}

    // Redirect 302 definitivo
    console.log(`[GO/MEDICALDESK] Redirecting to: ${launchUrl}`);
    res.redirect(302, launchUrl);
  } catch (err) {
    console.error('[go/medicaldesk]', err);
    res.status(500).send('Falha ao iniciar MedicalDesk');
  }
});

// ===== MEDICALDESK PROXY (DEVE VIR ANTES DE STATIC/FALLBACK) =====

// Debug middleware para /medicaldesk
app.use((req, _res, next) => {
  if (req.path.startsWith('/medicaldesk')) {
    const fullUrl = req.originalUrl || req.url;
    console.log('[MEDICALDESK HIT]', req.method, fullUrl, 'query:', req.query);
  }
  next();
});

// Proxy MedicalDesk (se configurado) - SEM REDIRECT
// O upstream espera a raiz /, NÃO /app (que retorna 401)
const MD_BASE = process.env.MEDICALDESK_URL;
const MD_ENABLED = String(process.env.FEATURE_MEDICALDESK || 'false').toLowerCase() === 'true';

if (MD_ENABLED && MD_BASE) {
  app.use(
    '/medicaldesk',
    createProxyMiddleware({
      target: MD_BASE,
      changeOrigin: true,
      // IMPORTANTE: pathRewrite remove /medicaldesk para enviar ao upstream
      // /medicaldesk/?token=... → /?token=...
      pathRewrite: (path) => path.replace(/^\/medicaldesk/, ''),
      onProxyReq: (proxyReq, req) => {
        proxyReq.setHeader('x-forwarded-host', req.get('host') || '');
        const newPath = req.path.replace(/^\/medicaldesk/, '');
        const fullUrl = req.originalUrl || req.url;
        console.log(`[MEDICALDESK PROXY] ${req.method} ${fullUrl} → ${MD_BASE}${newPath}`);
      },
      onProxyRes: (proxyRes, req) => {
        const fullUrl = req.originalUrl || req.url;
        console.log(`[MEDICALDESK PROXY RESPONSE] ${proxyRes.statusCode} for ${fullUrl}`);
      },
      onError: (err, req, res) => {
        console.error('[MedicalDesk proxy error]', err.message);
        res.writeHead(502).end('Bad gateway (MedicalDesk)');
      },
    })
  );
  console.log(`🏥 MedicalDesk proxy: /medicaldesk → ${MD_BASE} (feature enabled: ${MD_ENABLED})`);
} else {
  console.log(`🏥 MedicalDesk proxy: DISABLED (enabled=${MD_ENABLED}, url=${!!MD_BASE})`);
}

// ===== MEDICAL DESK ADVANCED PROTOCOLS (LOCAL) =====
// Rotas locais para protocolos clínicos (dados MOCK integrados)
// Nota: Proxy desabilitado temporariamente - usando dados locais para garantir disponibilidade
console.log(`📋 MDA Protocols: usando dados locais (MOCK integrado)`);

// ===== REDIRECTS DOS STUBS QA PARA PÁGINAS REAIS =====
// Redirects 301 permanentes dos stubs de QA para páginas canônicas reais
// Garante que bookmarks antigos e links do tour.html funcionem corretamente
app.get('/patient/waiting-room.html', (req, res) => {
  console.log('[REDIRECT 301] /patient/waiting-room.html → /sala-de-espera.html');
  res.redirect(301, '/sala-de-espera.html');
});

app.get('/patient/phr.html', (req, res) => {
  console.log('[REDIRECT 301] /patient/phr.html → /phr.html');
  res.redirect(301, '/phr.html');
});

app.get('/medicaldesk-demo/index.html', (req, res) => {
  console.log('[REDIRECT 301] /medicaldesk-demo/index.html → /dashboard-piloto.html');
  res.redirect(301, '/dashboard-piloto.html');
});

app.get('/medicaldesk-demo/agenda.html', (req, res) => {
  console.log('[REDIRECT 301] /medicaldesk-demo/agenda.html → /agenda.html');
  res.redirect(301, '/agenda.html');
});

// Redirects convenientes: páginas QA/Docs sem /public/
app.get('/galeria-paginas.html', (req, res) => {
  console.log('[REDIRECT 301] /galeria-paginas.html → /public/galeria-paginas.html');
  res.redirect(301, '/public/galeria-paginas.html');
});

app.get('/tour.html', (req, res) => {
  console.log('[REDIRECT 301] /tour.html → /public/tour.html');
  res.redirect(301, '/public/tour.html');
});

app.get('/bem-vindo.html', (req, res) => {
  console.log('[REDIRECT 301] /bem-vindo.html → /public/bem-vindo.html');
  res.redirect(301, '/public/bem-vindo.html');
});

app.get('/tester-guide.html', (req, res) => {
  console.log('[REDIRECT 301] /tester-guide.html → /public/tester-guide.html');
  res.redirect(301, '/public/tester-guide.html');
});

console.log('🔁 Redirects 301 configurados: stubs QA → páginas reais + docs QA');

// ===== SERVE FRONTEND ESTÁTICO =====
// IMPORTANTE: express.static DEVE vir DEPOIS do proxy MedicalDesk e ANTES do SPA Fallback!
// USANDO O NOVO CONSULTÓRIO VIRTUAL COM TEMA TEAL
const frontendPathHere = path.join(__dirname, '../../../client/dist');

// attached_assets -> /assets (imagens anexadas pelo usuário)
app.use('/assets', express.static(path.join(__dirname, '../../../attached_assets')));

// Frontend build (client) - CSS, JS, HTML DO CONSULTÓRIO VIRTUAL
app.use(express.static(frontendPathHere));

console.log('📁 Arquivos estáticos configurados:');
console.log(`   - /assets → attached_assets/`);
console.log(`   - / → client/dist/ (CONSULTÓRIO VIRTUAL - TEMA TEAL)`);

// ===== SPA FALLBACK =====
// Para React Router - retorna index.html para rotas não-API (DEPOIS do static!)
app.get('*', (req, res, next) => {
  // Se é uma chamada de API, continua para os handlers
  if (req.path.startsWith('/api/') || req.path.startsWith('/internal/')) {
    return next();
  }
  // IMPORTANTE: NÃO interceptar rotas do MedicalDesk (já processadas pelo proxy)
  if (req.path.startsWith('/medicaldesk')) {
    return next();
  }
  
  // NÃO interceptar páginas HTML estáticas ou arquivos estáticos
  // Isso permite que galeria-paginas.html, tour.html, etc funcionem diretamente
  const isStaticAsset = /\.(html|css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|txt|pdf)$/i.test(req.path);
  if (isStaticAsset) {
    // Deixa express.static tentar servir, se não existir vai dar 404 natural
    return next();
  }
  
  // Se é uma rota do frontend que não foi encontrada nos arquivos estáticos, retorna index.html
  res.sendFile(path.join(frontendPathHere, 'index.html'), (err) => {
    if (err) {
      console.error('Erro ao servir index.html:', err);
      res.status(404).json({ error: 'not_found' });
    }
  });
});

const requireToken = (req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  
  // Endpoints públicos (sem auth)
  const publicPaths = ['/healthz', '/health', '/api/health', '/'];
  if (publicPaths.includes(req.path)) return next();
  
  // Arquivos estáticos: HTML, CSS, JS, imagens, etc (públicos)
  // Isso permite acesso direto a páginas de documentação e assets
  const isStaticAsset = /\.(html|css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|txt|pdf|webp|avif)$/i.test(req.path);
  if (isStaticAsset) {
    return next();
  }
  
  // Proxy auction: passa direto (BidConnect faz autenticação própria)
  if (req.path.startsWith('/api/auction/')) {
    console.log(`[AUTH BYPASS] ${req.method} ${req.path} → proxying to auction service`);
    return next();
  }
  
  // MedicalDesk endpoints: públicos para integração
  if (req.path.startsWith('/api/medicaldesk/')) {
    return next();
  }
  
  // MedicalDesk protocols: públicos para busca de protocolos clínicos
  if (req.path.startsWith('/api/protocols/') || req.path.startsWith('/api/mda/protocols/')) {
    console.log(`[AUTH BYPASS] ${req.method} ${req.path} → public protocol lookup`);
    return next();
  }
  
  // Dr. AI endpoints: públicos para demos
  if (req.path.startsWith('/api/ai/')) {
    return next();
  }
  
  // Consultório Virtual endpoints: autenticação própria com JWT
  if (req.path.startsWith('/api/consultorio/')) {
    console.log(`[AUTH BYPASS] ${req.method} ${req.path} → Consultório Virtual (JWT auth)`);
    return next();
  }
  
  // Manager Dashboard endpoints: autenticação pode ser JWT ou INTERNAL_TOKEN
  if (req.path.startsWith('/api/manager/')) {
    console.log(`[AUTH BYPASS] ${req.method} ${req.path} → Manager Dashboard (JWT/INTERNAL_TOKEN auth)`);
    return next();
  }
  
  // Internal payments endpoint: autenticação própria inline
  if (req.path.startsWith('/api/internal/payments/')) {
    console.log(`[AUTH BYPASS] ${req.method} ${req.path} → Internal Payments (inline auth)`);
    return next();
  }
  
  const tok = req.header('X-Internal-Token');
  const expectedToken = process.env.INTERNAL_TOKEN || '';
  
  // Debug logging com flag condicional
  if (process.env.DEBUG_RC_TOKEN === "1") {
    console.log(`[${req.id}] Token check - provided: ${tok ? 'yes' : 'no'}, expected: ${expectedToken ? 'configured' : 'not configured'}`);
  }
  
  if (!tok || tok !== expectedToken) {
    console.log(`[${req.id}] Auth failed for ${req.method} ${req.path}`);
    return res.status(401).json({ error: 'invalid token', requestId: req.id });
  }
  next();
};

// ===== FALLBACK LOCAL: ROTAS DE PROTOCOLOS =====
// Se o proxy externo falhar, as rotas abaixo servem como fallback com dados MOCK

const protocolsDatabase = {
  hipertensao: {
    name: "Hipertensão Arterial Sistêmica",
    description: "Doença cardiovascular crônica caracterizada por níveis elevados de pressão arterial (≥140/90 mmHg).",
    diagnosis: {
      criteria: "PA ≥ 140/90 mmHg em pelo menos 2 consultas, MAPA ou MRPA confirmando valores elevados",
      exams: ["ECG", "Ecocardiograma", "Creatinina", "Potássio", "Glicemia", "Perfil lipídico"]
    },
    treatment: {
      lifestyle: ["Redução de sódio (<2g/dia)", "Dieta DASH", "Exercícios (150min/semana)", "Perda de peso"],
      medications: [
        { class: "IECA", examples: ["Enalapril 5-40mg/dia", "Captopril 25-150mg/dia"], line: "1ª linha" },
        { class: "BRA", examples: ["Losartana 50-100mg/dia"], line: "1ª linha" }
      ]
    },
    followup: {
      frequency: "A cada 3-6 meses",
      monitoring: ["PA", "Creatinina", "Potássio"]
    }
  },
  diabetes: {
    name: "Diabetes Mellitus Tipo 2",
    description: "Doença metabólica crônica caracterizada por hiperglicemia.",
    diagnosis: {
      criteria: "Glicemia jejum ≥126mg/dL (2x) ou HbA1c ≥6.5%",
      exams: ["Glicemia jejum", "HbA1c", "Perfil lipídico", "Creatinina"]
    },
    treatment: {
      lifestyle: ["Dieta hipocalórica", "Exercícios (150min/semana)", "Perda de peso 5-10%"],
      medications: [
        { class: "Biguanidas", examples: ["Metformina 500-2000mg/dia"], line: "1ª linha" },
        { class: "iSGLT2", examples: ["Dapagliflozina 10mg/dia"], line: "2ª linha" }
      ]
    },
    followup: {
      frequency: "A cada 3 meses",
      monitoring: ["HbA1c", "Glicemia", "Peso", "PA"]
    }
  },
  iam: {
    name: "Infarto Agudo do Miocárdio",
    description: "Síndrome coronariana aguda com necrose miocárdica.",
    diagnosis: {
      criteria: "Dor torácica + troponina elevada + ECG alterado",
      exams: ["ECG 12 derivações", "Troponina", "CK-MB", "Ecocardiograma"]
    },
    treatment: {
      lifestyle: ["Repouso 24-48h", "Cessação tabagismo", "Reabilitação cardíaca"],
      medications: [
        { class: "Antiagregantes", examples: ["AAS 100mg/dia", "Clopidogrel 75mg/dia"], line: "1ª linha" },
        { class: "Betabloqueadores", examples: ["Metoprolol 25-100mg"], line: "1ª linha" }
      ]
    },
    followup: {
      frequency: "7-14 dias pós-alta",
      monitoring: ["ECG", "Ecocardiograma", "Troponina"]
    }
  },
  asma: {
    name: "Asma Brônquica",
    description: "Doença inflamatória crônica das vias aéreas.",
    diagnosis: {
      criteria: "Sintomas variáveis + espirometria reversível",
      exams: ["Espirometria", "Pico de fluxo", "Raio-X tórax"]
    },
    treatment: {
      lifestyle: ["Evitar alérgenos", "Controle ambiental", "Vacinação influenza"],
      medications: [
        { class: "Corticoide inalatório", examples: ["Budesonida 200-800mcg/dia"], line: "1ª linha" },
        { class: "Beta-2 resgate", examples: ["Salbutamol 100-200mcg"], line: "Resgate" }
      ]
    },
    followup: {
      frequency: "1-3 meses até controle",
      monitoring: ["Sintomas", "Pico de fluxo", "Espirometria anual"]
    }
  },
  pneumonia: {
    name: "Pneumonia Comunitária",
    description: "Infecção aguda do parênquima pulmonar.",
    diagnosis: {
      criteria: "Sintomas respiratórios + infiltrado no RX tórax",
      exams: ["RX tórax", "Hemograma", "PCR", "Gasometria"]
    },
    treatment: {
      lifestyle: ["Repouso", "Hidratação 2-3L/dia"],
      medications: [
        { class: "Amoxicilina+Clav", examples: ["875/125mg 12/12h 5-7d"], line: "1ª linha" },
        { class: "Macrolídeos", examples: ["Azitromicina 500mg/dia 3-5d"], line: "Associação" }
      ]
    },
    followup: {
      frequency: "48-72h ambulatorial, RX 4-6sem",
      monitoring: ["Temperatura", "SatO2", "RX controle"]
    }
  }
};

// Rota para busca de protocolos clínicos
app.get('/api/protocols/:condition', (req, res) => {
  const condition = req.params.condition.toLowerCase().trim();
  const protocol = protocolsDatabase[condition];
  
  if (!protocol) {
    return res.status(404).json({ 
      error: "Protocolo não encontrado", 
      message: `Condições disponíveis: ${Object.keys(protocolsDatabase).join(', ')}`,
      available: Object.keys(protocolsDatabase),
      source: "local"
    });
  }
  
  console.log(`[PROTOCOLS] Servindo protocolo: ${condition}`);
  res.json({ success: true, protocol, source: "local", timestamp: new Date().toISOString() });
});

// Alias para compatibilidade: /api/mda/protocols
app.get('/api/mda/protocols/:condition', (req, res) => {
  const condition = req.params.condition.toLowerCase().trim();
  const protocol = protocolsDatabase[condition];
  
  if (!protocol) {
    return res.status(404).json({ 
      error: "Protocolo não encontrado",
      message: `Condições disponíveis: ${Object.keys(protocolsDatabase).join(', ')}`,
      available: Object.keys(protocolsDatabase),
      source: "local"
    });
  }
  
  console.log(`[MDA PROTOCOLS] Servindo protocolo: ${condition}`);
  res.json({ success: true, protocol, source: "local", timestamp: new Date().toISOString() });
});

// ============================================
// MEDICAL DESK ADVANCED API ENDPOINTS (PÚBLICAS)
// ============================================

// Stats para o dashboard
app.get('/api/stats', (req, res) => {
  res.json({
    protocolosAtivos: 12,
    sugestoesHoje: 45,
    alertasVies: 3,
    taxaAprovacao: 94,
    timestamp: new Date().toISOString()
  });
});

// Lista de pacientes
app.get('/api/patients', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'João Silva',
      age: 58,
      condition: 'SCA com dor torácica',
      status: 'critical',
      admissionDate: '2025-01-20T10:30:00Z'
    },
    {
      id: 2,
      name: 'Maria Costa',
      age: 72,
      condition: 'Pneumonia grave (CURB-65=4)',
      status: 'critical',
      admissionDate: '2025-01-21T08:15:00Z'
    },
    {
      id: 3,
      name: 'Pedro Santos',
      age: 45,
      condition: 'Hipertensão descompensada',
      status: 'stable',
      admissionDate: '2025-01-21T14:20:00Z'
    }
  ]);
});

// Lista completa de protocolos
app.get('/api/protocols', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Protocolo SCA',
      description: 'Síndrome Coronariana Aguda',
      usage: 245,
      accuracy: 94,
      lastUpdated: '2025-01-15T00:00:00Z'
    },
    {
      id: 2,
      name: 'Protocolo Pneumonia',
      description: 'Pneumonia Adquirida na Comunidade',
      usage: 189,
      accuracy: 91,
      lastUpdated: '2025-01-18T00:00:00Z'
    },
    {
      id: 3,
      name: 'Protocolo AVC',
      description: 'Acidente Vascular Cerebral',
      usage: 156,
      accuracy: 96,
      lastUpdated: '2025-01-12T00:00:00Z'
    }
  ]);
});

// Análise de sintomas
app.post('/api/analyze', (req, res) => {
  const { symptoms, age, sex, municipality } = req.body;

  let condition = 'Condição não identificada';
  let confidence = 70;
  let riskLevel = 'medium';
  let recommendations = [];
  let redFlags = [];

  if (symptoms && (symptoms.includes('Dor torácica') || symptoms.includes('dor torácica'))) {
    condition = 'Síndrome Coronariana Aguda';
    confidence = 85;
    riskLevel = 'high';
    recommendations = [
      'ECG de 12 derivações imediatamente',
      'Troponina seriada (0h, 1h, 3h)',
      'Aspirina 200mg VO imediatamente',
      'Considerar antiagregação dupla',
      'Monitorização contínua'
    ];
    redFlags = [
      'Dor torácica em repouso',
      'Fatores de risco cardiovascular'
    ];
  } else if (symptoms && (symptoms.includes('Dispneia') || symptoms.includes('dispneia'))) {
    condition = 'Possível Pneumonia ou Insuficiência Cardíaca';
    confidence = 75;
    riskLevel = 'medium';
    recommendations = [
      'Ausculta pulmonar detalhada',
      'Saturação de oxigênio',
      'Raio-X de tórax',
      'Considerar gasometria arterial'
    ];
    redFlags = [
      'Dispneia em repouso',
      'Taquipneia'
    ];
  }

  res.json({
    condition,
    confidence,
    riskLevel,
    recommendations,
    redFlags,
    analyzedSymptoms: symptoms || [],
    patientData: { age, sex, municipality },
    timestamp: new Date().toISOString()
  });
});

// Métricas de automação
app.get('/api/automation/metrics', (req, res) => {
  res.json({
    totalTasks: 45,
    completedTasks: 38,
    pendingTasks: 7,
    averageCompletionTime: '2.5 hours',
    efficiency: 84
  });
});

// Analytics gerais
app.get('/api/analytics', (req, res) => {
  res.json({
    totalPatients: 234,
    averageStayTime: '3.2 days',
    readmissionRate: 8.5,
    satisfactionScore: 4.6,
    mostCommonConditions: [
      { name: 'SCA', count: 45 },
      { name: 'Pneumonia', count: 38 },
      { name: 'AVC', count: 32 }
    ]
  });
});

// Dados populacionais
app.get('/api/population-data', (req, res) => {
  res.json({
    location: 'São Paulo - SP',
    population: 12400000,
    demographics: {
      ageGroups: [
        { range: '0-18', percentage: 22 },
        { range: '19-40', percentage: 35 },
        { range: '41-60', percentage: 28 },
        { range: '60+', percentage: 15 }
      ]
    },
    healthIndicators: {
      diabetesPrevalence: 8.4,
      hypertensionPrevalence: 24.1,
      obesityRate: 19.8
    },
    seasonalTrends: {
      respiratory: { current: 15, trend: 'up' },
      cardiovascular: { current: 24, trend: 'stable' },
      infectious: { current: 8, trend: 'down' }
    }
  });
});

// Tarefas de automação pendentes
app.get('/api/automation/pending', (req, res) => {
  res.json([
    {
      id: 1,
      patient: 'João Silva',
      task: 'Revisar ECG',
      priority: 'high',
      dueDate: '2025-01-22T12:00:00Z'
    },
    {
      id: 2,
      patient: 'Maria Costa',
      task: 'Avaliar Raio-X',
      priority: 'medium',
      dueDate: '2025-01-22T15:00:00Z'
    }
  ]);
});

// Cadeias de cuidado
app.get('/api/care-chains', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Cadeia SCA',
      steps: ['Triagem', 'ECG', 'Laboratório', 'Intervenção'],
      activePatients: 3,
      averageTime: '45 min'
    },
    {
      id: 2,
      name: 'Cadeia AVC',
      steps: ['Triagem', 'TC Crânio', 'Neurologia', 'Terapia'],
      activePatients: 1,
      averageTime: '30 min'
    }
  ]);
});

// Alertas de viés
app.get('/api/bias-alerts', (req, res) => {
  res.json([
    {
      id: 1,
      type: 'confirmation',
      description: 'Viés de confirmação detectado em 2 casos esta semana',
      severity: 'medium',
      affectedCases: 2
    },
    {
      id: 2,
      type: 'anchoring',
      description: 'Possível viés de ancoragem em diagnósticos de pneumonia',
      severity: 'low',
      affectedCases: 1
    }
  ]);
});

// ===== SEED ROUTES (SEM AUTH) =====
app.use('/api', seedRoutes);

// protege tudo a seguir (exceto /healthz)
app.use(requireToken);

// 1) ping simples (não usa OpenAI) — valida token/CORS
app.post('/ai/echo', (req, res) => {
  res.json({ ok: true, echo: req.body || null, ts: Date.now(), requestId: req.id });
});

// 2) completion real com OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/ai/complete', async (req, res) => {
  try {
    const { messages = [{ role: 'user', content: 'Diga "ok".' }], model = 'gpt-4o-mini' } = req.body || {};
    const out = await openai.chat.completions.create({ model, messages, stream: false });
    res.json({ ok: true, id: out.id, content: out.choices?.[0]?.message?.content || '', requestId: req.id });
  } catch (e) {
    console.error(`[${req.id}] ❌ AI completion failed:`, e?.message);
    res.status(500).json({ ok: false, error: e?.message || String(e), requestId: req.id });
  }
});

// ===== Physicians =====

// Cadastro/atualização de médico (usado pelo cadastro-medico.html)
app.post('/physicians', async (req,res)=>{
  try {
    const { id, crm, uf, name, specialty, phone, email, notes } = req.body || {};
    if (!id) {
      console.log(`[${req.id}] Missing physician ID in request`);
      return res.status(400).json({ok:false, error:'id_required', requestId: req.id});
    }
    const phy = await prisma.physician.upsert({
      where: { id },
      create: { id, crm, uf, name, specialty, availableNow: true },
      update: { crm, uf, name, specialty, availableNow: true }
    });
    console.log(`[${req.id}] ✅ Physician upserted: id=${id}, specialty=${specialty || 'unspecified'}`);
    res.json({ ok:true, physician: phy, requestId: req.id });
  } catch (e) {
    console.error(`[${req.id}] ❌ Physician upsert failed:`, e);
    res.status(500).json({ ok:false, error:'physician_upsert_failed', requestId: req.id });
  }
});

// Busca de médicos por especialidade (chamada pelo auction)
app.get('/internal/physicians/search', async (req,res)=>{
  try {
    const { specialty, availableNow } = req.query;
    const where = {};
    if (specialty) where.specialty = String(specialty);
    if (availableNow === 'true') where.availableNow = true;

    const physicians = await prisma.physician.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 10
    });
    console.log(`[${req.id}] ✅ Physician search: found=${physicians.length}, specialty=${specialty || 'any'}`);
    res.json({ ok:true, physicians, requestId: req.id });
  } catch (e) {
    console.error(`[${req.id}] ❌ Physician search failed:`, e);
    res.status(500).json({ ok:false, error:'physician_search_failed', requestId: req.id });
  }
});

// ===== Appointments =====

// Cria consulta a partir de um BID (leia specialty via physicianId já resolvido no auction)
app.post('/internal/appointments/from-bid', async (req,res)=>{
  try {
    const { bidId, patientId, physicianId, mode } = req.body || {};
    if (!bidId || !patientId) {
      console.log(`[${req.id}] Missing required fields: bidId=${!!bidId}, patientId=${!!patientId}`);
      return res.status(400).json({ ok:false, error:'bidId_and_patientId_required', requestId: req.id });
    }
    // simples: se veio physicianId, associa; senão, cria sem médico (será atribuído depois)
    const appt = await prisma.appointment.create({
      data: {
        bidId,
        patientId,
        physicianId: physicianId || null,
        status: mode === 'immediate' ? 'waiting' : 'scheduled',
        origin: 'auction',
        startsAt: mode === 'immediate' ? new Date() : null
      }
    });
    
    // Log de sucesso com appointmentId para observabilidade (hash patientId para privacidade)
    const crypto = await import('crypto');
    const hashedPatientId = crypto.createHash('sha256').update(patientId).digest('hex').substring(0, 8);
    console.log(`[${req.id}] ✅ Appointment created: appointmentId=${appt.id}, patientHash=${hashedPatientId}, physicianId=${physicianId || 'unassigned'}`);
    
    res.json({ ok:true, appointment: appt, requestId: req.id });
  } catch (e) {
    console.error(`[${req.id}] ❌ Create appointment failed:`, e);
    res.status(500).json({ ok:false, error:'create_from_bid_failed', requestId: req.id });
  }
});

// ===== AUDIT LOGS =====

// Utilitário para hash de IP
function hashIP(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1') return 'local';
  return crypto.createHash('sha256').update(ip + (process.env.IP_SALT || 'telemed-salt')).digest('hex').substring(0, 12);
}

// Utilitário para sanitizar payload
function sanitizePayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  
  const sanitized = { ...payload };
  
  // Remover ou mascarar campos sensíveis
  const sensitiveFields = ['password', 'cpf', 'rg', 'card', 'cvv', 'ssn', 'token'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  });
  
  // Mascarar e-mails
  Object.keys(sanitized).forEach(key => {
    if (key.includes('email') && typeof sanitized[key] === 'string') {
      const email = sanitized[key];
      const [user, domain] = email.split('@');
      if (user && domain) {
        sanitized[key] = `${user.substring(0, 2)}***@${domain}`;
      }
    }
  });
  
  return sanitized;
}

// POST /api/logs - Receber logs do frontend
app.post('/api/logs', async (req, res) => {
  try {
    const { logs = [] } = req.body;
    
    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        error: 'logs_array_required', 
        requestId: req.id 
      });
    }
    
    // Processar logs em batch
    const processedLogs = logs.map(log => {
      // Validar campos obrigatórios
      if (!log.eventType || !log.category) {
        throw new Error(`Invalid log entry: missing eventType or category`);
      }
      
      return {
        traceId: log.traceId || req.id,
        eventType: log.eventType,
        category: log.category,
        level: log.level || 'INFO',
        userId: log.userId || null,
        sessionId: log.sessionId || null,
        payload: sanitizePayload(log.payload || {}),
        userAgent: (req.get('User-Agent') || '').substring(0, 500), // Limitar tamanho
        ipHash: hashIP(req.ip || req.connection?.remoteAddress),
        createdAt: log.timestamp ? new Date(log.timestamp) : new Date()
      };
    });
    
    // Salvar no banco
    const result = await prisma.auditLog.createMany({
      data: processedLogs,
      skipDuplicates: true
    });
    
    console.log(`[${req.id}] 📋 Saved ${result.count} audit logs`);
    
    res.json({ 
      ok: true, 
      saved: result.count, 
      requestId: req.id 
    });
    
  } catch (e) {
    console.error(`[${req.id}] ❌ Failed to save audit logs:`, e.message);
    res.status(500).json({ 
      ok: false, 
      error: 'save_logs_failed', 
      details: e.message,
      requestId: req.id 
    });
  }
});

// POST /api/logs/cleanup - Job de limpeza manual (para testes)

// POST /api/events - Endpoint padronizado para eventos do funil
app.post('/api/events', async (req, res) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events)) {
      return res.status(400).json({ ok: false, error: 'events deve ser um array' });
    }
    
    // Importar schema de validação
    const { validateEvent } = await import('./validation-schemas.js');
    
    const results = [];
    const errors = [];
    
    for (const event of events) {
      // Validar evento conforme contrato
      const validation = validateEvent(event.event_type, event.payload || {});
      
      if (!validation.valid) {
        errors.push({
          event_type: event.event_type,
          errors: validation.errors || [validation.error]
        });
        continue;
      }
      
      const eventEntry = {
        traceId: event.trace_id || req.id,
        eventType: event.event_type,
        category: event.category || 'user_journey',
        level: event.level || 'INFO',
        payload: validation.normalizedPayload,
        userAgent: req.get('User-Agent') || 'unknown',
        ipHash: hashIP(getClientIP(req))
      };
      
      const savedEvent = await prisma.auditLog.create({ data: eventEntry });
      results.push({ id: savedEvent.id, event_type: event.event_type });
    }
    
    const response = { 
      ok: true, 
      processed: results.length, 
      events: results 
    };
    
    if (errors.length > 0) {
      response.validation_errors = errors;
      response.ok = false;
    }
    
    res.status(errors.length > 0 ? 400 : 200).json(response);
    
  } catch (error) {
    console.error('Events endpoint error:', error.message);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// POST /api/webrtc-metrics - Métricas de WebRTC
app.post('/api/webrtc-metrics', async (req, res) => {
  try {
    const { metrics, user_agent, timestamp } = req.body;
    
    if (!Array.isArray(metrics)) {
      return res.status(400).json({ ok: false, error: 'metrics deve ser um array' });
    }
    
    // Agregar métricas por sessão
    const sessionMetrics = {};
    
    metrics.forEach(metric => {
      const sessionId = metric.session_id;
      if (!sessionMetrics[sessionId]) {
        sessionMetrics[sessionId] = {
          session_id: sessionId,
          samples: [],
          quality_issues: []
        };
      }
      
      sessionMetrics[sessionId].samples.push(metric);
      
      // Detectar problemas de qualidade
      if (metric.audio && metric.audio.packets_lost > 5) {
        sessionMetrics[sessionId].quality_issues.push('audio_packet_loss');
      }
      if (metric.video && metric.video.frames_dropped > 10) {
        sessionMetrics[sessionId].quality_issues.push('video_frame_drops');
      }
      if (metric.connection && metric.connection.rtt > 0.5) {
        sessionMetrics[sessionId].quality_issues.push('high_latency');
      }
    });
    
    // Salvar métricas agregadas
    const results = [];
    
    for (const [sessionId, data] of Object.entries(sessionMetrics)) {
      const aggregated = {
        session_id: sessionId,
        total_samples: data.samples.length,
        quality_issues: [...new Set(data.quality_issues)],
        avg_rtt: data.samples
          .filter(s => s.connection && s.connection.rtt > 0)
          .reduce((sum, s, _, arr) => sum + s.connection.rtt / arr.length, 0),
        timestamp: timestamp || Date.now()
      };
      
      const logEntry = await prisma.auditLog.create({
        data: {
          traceId: sessionId,
          eventType: 'webrtc_session_metrics',
          category: 'performance',
          level: aggregated.quality_issues.length > 0 ? 'WARN' : 'INFO',
          payload: aggregated,
          userAgent: user_agent || 'unknown',
          ipHash: hashIP(getClientIP(req))
        }
      });
      
      results.push({ session_id: sessionId, log_id: logEntry.id });
    }
    
    res.json({ ok: true, processed: results.length, sessions: results });
    
  } catch (error) {
    console.error('WebRTC metrics error:', error.message);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// GET /api/metrics - Métricas do sistema
app.get('/api/metrics', async (req, res) => {
  try {
    const since = req.query.since ? new Date(req.query.since) : new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h padrão
    
    // Métricas básicas
    const totalLogs = await prisma.auditLog.count({
      where: { createdAt: { gte: since } }
    });
    
    const errorLogs = await prisma.auditLog.count({
      where: {
        createdAt: { gte: since },
        level: { in: ['ERROR', 'FATAL'] }
      }
    });
    
    const webrtcSessions = await prisma.auditLog.count({
      where: {
        createdAt: { gte: since },
        eventType: 'webrtc_session_metrics'
      }
    });
    
    // Métricas de eventos do funil
    const funnelEvents = await prisma.auditLog.findMany({
      where: {
        createdAt: { gte: since },
        eventType: { contains: 'signup' }
      },
      select: { eventType: true }
    });
    
    const signupEvents = funnelEvents.length;
    
    // Response time mock (seria calculado com timestamps reais)
    const avgResponseTime = Math.random() * 500 + 200; // Mock para demo
    
    const metrics = {
      timestamp: new Date().toISOString(),
      period: { since: since.toISOString(), until: new Date().toISOString() },
      logs: {
        total: totalLogs,
        errors: errorLogs,
        error_rate: totalLogs > 0 ? (errorLogs / totalLogs * 100).toFixed(2) : 0
      },
      performance: {
        avg_response_time_ms: Math.round(avgResponseTime),
        p95_response_time_ms: Math.round(avgResponseTime * 1.5) // Mock
      },
      webrtc: {
        total_sessions: webrtcSessions,
        // Adicionar métricas de qualidade aqui
      },
      funnel: {
        signup_events: signupEvents
        // Adicionar outras métricas do funil
      }
    };
    
    res.json(metrics);
    
  } catch (error) {
    console.error('Metrics endpoint error:', error.message);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});
app.post('/api/logs/cleanup', async (req, res) => {
  try {
    const { dryRun = false } = req.body;
    
    // Encontrar logs expirados
    const expiredLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { expiresAt: { lte: new Date() } },
          { createdAt: { lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // 30 dias
        ]
      },
      select: { id: true, createdAt: true }
    });
    
    if (dryRun) {
      console.log(`[${req.id}] 🗑️ DRY RUN: Would delete ${expiredLogs.length} expired logs`);
      return res.json({
        ok: true,
        dryRun: true,
        toDelete: expiredLogs.length,
        requestId: req.id
      });
    }
    
    // Deletar em batches
    const batchSize = 1000;
    let totalDeleted = 0;
    
    for (let i = 0; i < expiredLogs.length; i += batchSize) {
      const batch = expiredLogs.slice(i, i + batchSize);
      const result = await prisma.auditLog.deleteMany({
        where: {
          id: { in: batch.map(log => log.id) }
        }
      });
      totalDeleted += result.count;
    }
    
    console.log(`[${req.id}] 🗑️ Cleanup completed: deleted ${totalDeleted} expired logs`);
    
    res.json({
      ok: true,
      deleted: totalDeleted,
      requestId: req.id
    });
    
  } catch (e) {
    console.error(`[${req.id}] ❌ Cleanup failed:`, e.message);
    res.status(500).json({ 
      ok: false, 
      error: 'cleanup_failed', 
      requestId: req.id 
    });
  }
});

// ===== JOBS AUTOMÁTICOS =====

// Job de limpeza automática que roda a cada 6 horas
let cleanupJobCount = 0;

async function runCleanupJob() {
  try {
    cleanupJobCount++;
    const jobId = `cleanup_${Date.now()}`;
    console.log(`🗑️ [${jobId}] Iniciando job de limpeza automática #${cleanupJobCount}`);
    
    // Encontrar logs expirados (mais de 30 dias)
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const expiredLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { expiresAt: { lte: new Date() } },
          { createdAt: { lte: cutoffDate } }
        ]
      },
      select: { id: true, createdAt: true, traceId: true }
    });
    
    if (expiredLogs.length === 0) {
      console.log(`🗑️ [${jobId}] Nenhum log expirado encontrado`);
      return { deleted: 0, jobId };
    }
    
    // Deletar em batches de 1000
    let totalDeleted = 0;
    const batchSize = 1000;
    
    for (let i = 0; i < expiredLogs.length; i += batchSize) {
      const batch = expiredLogs.slice(i, i + batchSize);
      const result = await prisma.auditLog.deleteMany({
        where: {
          id: { in: batch.map(log => log.id) }
        }
      });
      totalDeleted += result.count;
      
      // Log do progresso
      console.log(`🗑️ [${jobId}] Batch ${Math.floor(i/batchSize) + 1}: ${result.count} logs deletados`);
    }
    
    // Log de auditoria do próprio job
    await prisma.auditLog.create({
      data: {
        traceId: jobId,
        eventType: 'logs_cleanup_completed',
        category: 'system',
        level: 'INFO',
        payload: {
          deleted_count: totalDeleted,
          job_number: cleanupJobCount,
          cutoff_date: cutoffDate.toISOString()
        },
        userAgent: 'system-job',
        ipHash: 'internal'
      }
    });
    
    console.log(`✅ [${jobId}] Job de limpeza concluído: ${totalDeleted} logs deletados`);
    return { deleted: totalDeleted, jobId };
    
  } catch (error) {
    console.error(`❌ Job de limpeza falhou:`, error.message);
    
    // Log do erro
    try {
      await prisma.auditLog.create({
        data: {
          traceId: `cleanup_error_${Date.now()}`,
          eventType: 'logs_cleanup_failed',
          category: 'system',
          level: 'ERROR',
          payload: {
            error: error.message,
            job_number: cleanupJobCount
          },
          userAgent: 'system-job',
          ipHash: 'internal'
        }
      });
    } catch (logError) {
      console.error('Falha ao registrar erro do job:', logError.message);
    }
    
    return { error: error.message };
  }
}

// Configurar job para rodar a cada 6 horas (21600000 ms)
function startCleanupJob() {
  const interval = 6 * 60 * 60 * 1000; // 6 horas
  
  // Primeira execução após 1 minuto de startup
  setTimeout(runCleanupJob, 60 * 1000);
  
  // Execuções periódicas
  setInterval(runCleanupJob, interval);
  
  console.log(`🚀 Job de limpeza automática configurado para rodar a cada 6 horas`);
}

// ===== MEDICALDESK API ENDPOINTS =====

// Feature flag MedicalDesk
app.get('/api/medicaldesk/feature', (req, res) => {
  res.json({
    feature: String(process.env.FEATURE_MEDICALDESK || '').toLowerCase() === 'true',
    hasBase: !!process.env.MEDICALDESK_URL
  });
});

// Criar sessão MedicalDesk (POST - mantido para compatibilidade)
app.post('/api/medicaldesk/session', (req, res) => {
  const feature = String(process.env.FEATURE_MEDICALDESK || '').toLowerCase() === 'true';
  const baseOk = !!process.env.MEDICALDESK_URL;
  
  if (!feature || !baseOk) {
    return res.status(503).json({ ok: false, error: 'MedicalDesk desabilitado' });
  }

  const { patientId, doctorId } = req.body || {};
  if (!patientId || !doctorId) {
    return res.status(400).json({ ok: false, error: 'patientId e doctorId obrigatórios' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ ok: false, error: 'JWT_SECRET ausente' });
  }

  const token = jwt.sign(
    { sub: String(doctorId), patientId: String(patientId), role: 'doctor' },
    process.env.JWT_SECRET,
    { expiresIn: '15m', issuer: 'telemed' }
  );
  
  res.json({ 
    ok: true, 
    launchUrl: `/medicaldesk/?token=${encodeURIComponent(token)}` 
  });
});

// ===== DR. AI ENDPOINTS =====

// Handler demo para Dr. AI (resposta simulada)
const demoAiHandler = (req, res) => {
  const q = (req.body && (req.body.question || req.body.q)) || req.query.q || 'pergunta de teste';
  res.json({ 
    ok: true, 
    answer: `Resposta DEMO para: "${q}".\n(IA simulada localmente)`, 
    traceId: String(Date.now()) 
  });
};

app.all('/api/ai/answer', demoAiHandler);
app.all('/api/ai/ask', demoAiHandler);

// ===== EXPORT PDF ROUTES =====
app.post('/api/export-pdf/wells-score', (req, res) => {
  try {
    const { score, interpretation, recommendation, criteria } = req.body;

    if (score === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Score é obrigatório'
      });
    }

    // Gerar HTML simples para PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Wells Score Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    .header { border-bottom: 2px solid #D97706; padding-bottom: 10px; margin-bottom: 20px; }
    .logo { font-size: 24px; font-weight: bold; color: #2BB3A8; }
    .subtitle { font-size: 11px; color: #666; }
    .title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; }
    .score-box { background: #FFF7ED; border-left: 4px solid #D97706; padding: 15px; margin: 15px 0; }
    .score-value { font-size: 32px; font-weight: bold; color: #D97706; }
    .section { margin: 15px 0; }
    .label { font-weight: bold; color: #333; }
    .value { color: #666; margin-top: 5px; }
    .criteria-list { margin: 10px 0; padding-left: 20px; }
    .criteria-item { margin: 5px 0; }
    .footer { border-top: 1px solid #DDD; margin-top: 30px; padding-top: 15px; font-size: 10px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">TeleMed</div>
    <div class="subtitle">Plataforma de Telemedicina</div>
  </div>
  
  <h2 class="title">Relatório - Escore de Wells (TEP)</h2>
  <div class="subtitle">Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
  
  <div class="score-box">
    <div class="label">Escore Total</div>
    <div class="score-value">${score} pontos</div>
  </div>
  
  <div class="section">
    <div class="label">Interpretação:</div>
    <div class="value">${interpretation}</div>
  </div>
  
  <div class="section">
    <div class="label">Recomendação:</div>
    <div class="value">${recommendation}</div>
  </div>
  
  ${criteria ? `
  <div class="section">
    <div class="label">Critérios Selecionados:</div>
    <div class="criteria-list">
      ${Object.entries(criteria)
        .filter(([_, value]) => value)
        .map(([key, _]) => `<div class="criteria-item">✓ ${key}</div>`)
        .join('')}
    </div>
  </div>
  ` : ''}
  
  <div class="footer">
    <p>© TeleMed - Telemedicina Profissional | Documento gerado automaticamente</p>
  </div>
  
  <script>
    window.print();
  </script>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);

  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar PDF: ' + error.message
    });
  }
});

// Arquivos estáticos configurados acima (antes do SPA fallback)

app.listen(PORT, '0.0.0.0', () => {
  console.log('[telemed] listening on 0.0.0.0:' + PORT);
  
  // Iniciar job de limpeza automática
  startCleanupJob();
});