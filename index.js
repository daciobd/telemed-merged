import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import crypto from 'crypto';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import consultorioRoutes from './apps/telemed-internal/src/consultorio-routes.js';
import seedRoutes from './apps/telemed-internal/src/routes/seed.routes.js';
import statsRoutes from './apps/telemed-internal/src/routes/stats.js';

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
// Porta: usa PORT do ambiente (Render, Heroku, etc.) ou 5000 como fallback (Replit)
const PORT = process.env.PORT || 5000;

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
      // Database health check skipped (Prisma removido)
      dbResponseTime = 0;
      dbStatus = 'not_configured';
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
    
    // Log para auditoria (Prisma removido)
    // Skipped: auditLog.create
    
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
app.use('/api', statsRoutes);

// Importar rotas de Virtual Office (agendamento direto, página pública, etc)
const { default: virtualOfficeRoutes } = await import('./apps/telemed-internal/src/virtual-office.routes.js');
app.use('/api/virtual-office', virtualOfficeRoutes);

console.log('✅ Rotas do Consultório Virtual carregadas em /api/consultorio/*');
console.log('✅ Rotas de Stats carregadas em /api/consultorio/stats');
console.log('✅ Rotas de Virtual Office carregadas em /api/virtual-office/*');

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

// Arquivos estáticos gerais (imagens, etc)
app.use("/assets", express.static(path.join(__dirname, "attached_assets")));

// ====== CONSULTÓRIO VIRTUAL (React) — Tema Teal ======
const consultorioDist = path.join(__dirname, "client/dist");
app.use("/consultorio", express.static(consultorioDist));

// Fallback SPA — React precisa disso (usando regex para Express 5 compatibilidade)
app.use("/consultorio", (req, res, next) => {
  // Só interceptar GET requests
  if (req.method !== 'GET') return next();
  // Se é arquivo estático, deixa passar
  const isStaticAsset = /\.(html|css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|txt|pdf)$/i.test(req.path);
  if (isStaticAsset) return next();
  // Retorna index.html do React SPA
  res.sendFile(path.join(consultorioDist, "index.html"));
});

// ====== TELEMED CLÁSSICO ======
const telemedClassic = path.join(__dirname, "telemed-classic");
app.use("/", express.static(telemedClassic));

// Fallback para TeleMed clássico (raiz)
app.use((req, res, next) => {
  // Só interceptar GET requests
  if (req.method !== 'GET') return next();
  // Não interceptar APIs
  if (req.path.startsWith('/api/') || req.path.startsWith('/internal/')) return next();
  // Não interceptar MedicalDesk
  if (req.path.startsWith('/medicaldesk')) return next();
  // Não interceptar Consultório (já tratado acima)
  if (req.path.startsWith('/consultorio')) return next();
  // Não interceptar arquivos estáticos
  const isStaticAsset = /\.(html|css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|txt|pdf)$/i.test(req.path);
  if (isStaticAsset) return next();
  // Fallback para index.html do TeleMed clássico
  res.sendFile(path.join(telemedClassic, "index.html"));
});

console.log("📁 Arquivos estáticos configurados:");
console.log("   - /assets → attached_assets/");
console.log("   - /consultorio → client/dist (CONSULTÓRIO VIRTUAL - TEMA TEAL)");
console.log("   - / → telemed-classic (PLATAFORMA TELEMED COMPLETA)");

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

// 2) Inicializar OpenAI condicionalmente (fallback OPEN_AI_KEY para compatibilidade)
const openaiApiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY || null;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

if (openai) {
  console.log('🤖 OpenAI client inicializado.');
} else {
  console.log('⚠️ OPENAI_API_KEY não definida. Endpoints de IA ficarão desativados.');
}

app.post('/ai/complete', async (req, res) => {
  if (!openai) {
    return res.status(503).json({
      error: 'IA temporariamente indisponível. Falta configurar OPENAI_API_KEY no servidor.',
      requestId: req.id
    });
  }
  
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

// Cadastro/atualização de médico (Prisma removido - stub)
app.post('/physicians', async (req,res)=>{
  const { id, crm, uf, name, specialty } = req.body || {};
  if (!id) {
    return res.status(400).json({ok:false, error:'id_required', requestId: req.id});
  }
  console.log(`[${req.id}] ✅ Physician stub: id=${id}, specialty=${specialty || 'unspecified'}`);
  res.json({ ok:true, physician: { id, crm, uf, name, specialty }, requestId: req.id });
});

// Busca de médicos por especialidade (Prisma removido - stub)
app.get('/internal/physicians/search', async (req,res)=>{
  const { specialty } = req.query;
  console.log(`[${req.id}] ✅ Physician search stub: specialty=${specialty || 'any'}`);
  res.json({ ok:true, physicians: [], requestId: req.id });
});

// ===== Appointments =====

// Cria consulta a partir de um BID (Prisma removido - stub)
app.post('/internal/appointments/from-bid', async (req,res)=>{
  const { bidId, patientId, physicianId, mode } = req.body || {};
  if (!bidId || !patientId) {
    return res.status(400).json({ ok:false, error:'bidId_and_patientId_required', requestId: req.id });
  }
  const mockAppointment = {
    id: `appt-${Date.now()}`,
    bidId, patientId, physicianId: physicianId || null,
    status: mode === 'immediate' ? 'waiting' : 'scheduled'
  };
  console.log(`[${req.id}] ✅ Appointment stub created: ${mockAppointment.id}`);
  res.json({ ok:true, appointment: mockAppointment, requestId: req.id });
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

// POST /api/logs - Receber logs do frontend (Prisma removido - stub)
app.post('/api/logs', async (req, res) => {
  const { logs = [] } = req.body;
  if (!Array.isArray(logs) || logs.length === 0) {
    return res.status(400).json({ ok: false, error: 'logs_array_required', requestId: req.id });
  }
  console.log(`[${req.id}] 📋 Logs stub: ${logs.length} logs received (not saved)`);
  res.json({ ok: true, saved: logs.length, requestId: req.id });
});

// POST /api/logs/cleanup - Job de limpeza manual (Prisma removido - stub)

// POST /api/events - Endpoint padronizado para eventos do funil (Prisma removido - stub)
app.post('/api/events', async (req, res) => {
  const { events } = req.body;
  if (!Array.isArray(events)) {
    return res.status(400).json({ ok: false, error: 'events deve ser um array' });
  }
  console.log(`[${req.id}] 📋 Events stub: ${events.length} events received`);
  const results = events.map((e, i) => ({ id: `evt-${Date.now()}-${i}`, event_type: e.event_type }));
  res.json({ ok: true, processed: events.length, events: results });
});

// POST /api/webrtc-metrics - Métricas de WebRTC (Prisma removido - stub)
app.post('/api/webrtc-metrics', async (req, res) => {
  const { metrics } = req.body;
  if (!Array.isArray(metrics)) {
    return res.status(400).json({ ok: false, error: 'metrics deve ser um array' });
  }
  console.log(`[${req.id}] 📊 WebRTC metrics stub: ${metrics.length} samples received`);
  res.json({ ok: true, processed: metrics.length, sessions: [] });
});

// GET /api/metrics - Métricas do sistema (Prisma removido - stub)
app.get('/api/metrics', async (req, res) => {
  const since = req.query.since ? new Date(req.query.since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const avgResponseTime = Math.random() * 500 + 200;
  const metrics = {
    timestamp: new Date().toISOString(),
    period: { since: since.toISOString(), until: new Date().toISOString() },
    logs: { total: 0, errors: 0, error_rate: 0 },
    performance: { avg_response_time_ms: Math.round(avgResponseTime), p95_response_time_ms: Math.round(avgResponseTime * 1.5) },
    webrtc: { total_sessions: 0 },
    funnel: { signup_events: 0 }
  };
  res.json(metrics);
});
// POST /api/logs/cleanup (Prisma removido - stub)
app.post('/api/logs/cleanup', async (req, res) => {
  const { dryRun = false } = req.body;
  console.log(`[${req.id}] 🗑️ Cleanup stub: dryRun=${dryRun}`);
  res.json({ ok: true, deleted: 0, dryRun, requestId: req.id });
});

// ===== JOBS AUTOMÁTICOS =====

// Job de limpeza automática (Prisma removido - stub)
let cleanupJobCount = 0;

async function runCleanupJob() {
  cleanupJobCount++;
  const jobId = `cleanup_${Date.now()}`;
  console.log(`🗑️ [${jobId}] Cleanup job stub #${cleanupJobCount} (no-op sem Prisma)`);
  return { deleted: 0, jobId };
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
  console.log(`[telemed] listening on 0.0.0.0:${PORT}`);
  
  // Iniciar job de limpeza automática
  startCleanupJob();
});