import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import crypto from 'crypto';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// TelemedMerged: Feature flags e configurações
const FEATURE_PRICING = String(process.env.FEATURE_PRICING ?? 'true') === 'true';
const AUCTION_SERVICE_URL = process.env.AUCTION_SERVICE_URL || 'http://localhost:5001/api';

app.set('trust proxy', 1);
app.use(cors({ origin: ['https://telemed-deploy-ready.onrender.com'], credentials: true, exposedHeaders: ['*'] }));

// NÃO aplicar express.json() globalmente - causa problema com proxy!
// Será aplicado seletivamente após os proxies

// Security headers middleware
app.use((req, res, next) => {
  // CSP para API
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  // HSTS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Remove server signature
  res.removeHeader('X-Powered-By');
  // No cache for API responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
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
const PORT = process.env.PORT || 3000;

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

// ===== MOCK LOCAL DO AUCTION (ligado por flag) =====
const USE_LOCAL_AUCTION_MOCK = process.env.USE_LOCAL_AUCTION_MOCK === 'true';

if (USE_LOCAL_AUCTION_MOCK) {
  const mockRouter = express.Router();

  // Log de requisições no mock
  mockRouter.use((req, _res, next) => {
    console.log('[MOCK AUCTION]', req.method, req.path);
    next();
  });

  // Health
  mockRouter.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'auction-mock', ts: new Date().toISOString() });
  });

  // Criar bid
  mockRouter.post('/bids', express.json(), (req, res) => {
    const body = req.body || {};
    // Aceitar os 3 formatos comuns automaticamente
    const payload = body.bid || body;

    const specialty = payload.specialty || payload.consultationType || payload.consultation_type;
    const amountCents = payload.amountCents || payload.amount_cents || payload.initialAmount || payload.valueCents || payload.priceCents || Math.round((payload.amount || 0) * 100);
    const mode = payload.mode || 'immediate';

    if (!specialty || !amountCents) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Required',
        expected: ['specialty', 'amountCents|initialAmount|amount|valueCents|priceCents'],
        received: Object.keys(payload || {})
      });
    }

    const bid = {
      id: 'bid_' + Math.random().toString(36).slice(2, 10),
      specialty,
      amountCents: Number(amountCents),
      mode,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    return res.status(201).json({ success: true, bid });
  });

  // Buscar médicos
  mockRouter.post('/bids/:id/search', (_req, res) => {
    res.json({
      success: true,
      immediate: [{ id: 'doc_1', name: 'Dr. Roberto', specialty: 'cardiology' }],
      scheduled: [{ id: 'doc_2', name: 'Dra. Maria', specialty: 'cardiology', nextSlots: ['2025-10-12T20:00:00Z']}],
      message: 'Mock: médicos encontrados'
    });
  });

  // Aumentar bid
  mockRouter.put('/bids/:id/increase', express.json(), (req, res) => {
    const newValue = req.body?.new_value || req.body?.newValue || req.body?.amountCents || req.body?.amount_cents;
    if (!newValue) return res.status(400).json({ error: 'validation_error', message: 'new_value Required' });
    res.json({ success: true, bidId: req.params.id, new_value: Number(newValue) });
  });

  // Aceitar médico
  mockRouter.post('/bids/:id/accept', express.json(), (req, res) => {
    const doctorId = req.body?.doctorId || req.body?.doctor_id || req.body?.doctor?.id;
    if (!doctorId) return res.status(400).json({ error: 'validation_error', message: 'doctorId Required' });
    res.json({
      success: true,
      consultation_id: 'c_' + Math.random().toString(36).slice(2, 10),
      is_immediate: true,
      doctor: { id: doctorId, name: 'Dr. Mock' }
    });
  });

  app.use('/api/auction', mockRouter);
  console.log('➡️  USE_LOCAL_AUCTION_MOCK=TRUE — usando mock local no gateway');
}

// Proxy reverso para o serviço de leilão (quando mock desligado)
// SEMPRE reescreve /api/auction para '' porque:
// - Se target termina com /api → /api/auction/bids vira /api + /bids = /api/bids ✅
// - Se target termina na raiz → /api/auction/bids vira / + /bids = /bids ✅
app.use('/api/auction', (req, res, next) => {
  console.log(`[PROXY] ${req.method} ${req.path} → forwarding to ${AUCTION_SERVICE_URL}`);
  // Feature flag: bloqueia tudo se desligado
  if (!FEATURE_PRICING) {
    return res.status(503).json({ error: 'pricing_disabled' });
  }
  next();
}, createProxyMiddleware({
  target: AUCTION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auction': '' },
  proxyTimeout: 15000,
  timeout: 20000,
  onProxyReq: (proxyReq, req, _res) => {
    console.log(`[PROXY REQ] ${req.method} ${req.path} → ${proxyReq.host}${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, _res) => {
    console.log(`[PROXY RES] ${req.method} ${req.path} ← ${proxyRes.statusCode}`);
  },
  onError: (err, _req, res) => {
    console.error('[Auction Proxy Error]', err.message);
    if (!res.headersSent) {
      res.status(502).json({ 
        error: 'auction_service_unavailable', 
        details: err.message 
      });
    }
  },
  logLevel: 'debug'
}));

console.log(`💰 Pricing/Auction proxy: /api/auction → ${AUCTION_SERVICE_URL} (sempre com pathRewrite)`);
console.log(`   Feature enabled: ${FEATURE_PRICING}`);

// ===== JSON BODY PARSER (após proxies) =====
// Agora que os proxies foram montados, podemos parsear JSON
// para as demais rotas sem interferir no proxy
app.use(express.json());

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

// ===== SERVE FRONTEND ESTÁTICO =====
// Serve arquivos estáticos do build do telemed-deploy-ready
const frontendPath = path.join(__dirname, '../../telemed-deploy-ready');
app.use(express.static(frontendPath));

console.log(`📁 Frontend estático: ${frontendPath}`);

// ===== SPA FALLBACK =====
// Para React Router - retorna index.html para rotas não-API
app.get('*', (req, res, next) => {
  // Se é uma chamada de API, continua para os handlers
  if (req.path.startsWith('/api/') || req.path.startsWith('/internal/')) {
    return next();
  }
  // Se é uma rota do frontend, retorna index.html
  res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
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
  
  // Proxy auction: passa direto (BidConnect faz autenticação própria)
  if (req.path.startsWith('/api/auction/')) {
    console.log(`[AUTH BYPASS] ${req.method} ${req.path} → proxying to auction service`);
    return next();
  }
  
  // MedicalDesk endpoints: públicos para integração
  if (req.path.startsWith('/api/medicaldesk/')) {
    return next();
  }
  
  // Dr. AI endpoints: públicos para demos
  if (req.path.startsWith('/api/ai/')) {
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

// ===== MEDICALDESK INTEGRATION =====

// Proxy MedicalDesk (se configurado)
if (process.env.MEDICALDESK_URL) {
  app.use('/medicaldesk', createProxyMiddleware({
    target: process.env.MEDICALDESK_URL,
    changeOrigin: true,
    pathRewrite: { '^/medicaldesk': '' },
  }));
  console.log(`🏥 MedicalDesk proxy: /medicaldesk → ${process.env.MEDICALDESK_URL}`);
}

// Feature flag MedicalDesk
app.get('/api/medicaldesk/feature', (req, res) => {
  res.json({
    feature: String(process.env.FEATURE_MEDICALDESK || '').toLowerCase() === 'true',
    hasBase: !!process.env.MEDICALDESK_URL
  });
});

// Criar sessão MedicalDesk
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
    launchUrl: `/medicaldesk/app?token=${encodeURIComponent(token)}` 
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

app.listen(PORT, () => {
  console.log('[telemed] listening on', PORT);
  
  // Iniciar job de limpeza automática
  startCleanupJob();
});