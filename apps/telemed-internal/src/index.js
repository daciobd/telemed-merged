import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const app = express();
app.use(cors({ origin: '*', exposedHeaders: ['*'] }));
app.use(express.json());

// RequestId middleware para rastreabilidade
app.use((req, res, next) => { 
  // Aceita incoming x-request-id ou gera novo UUID
  req.id = req.header('x-request-id') || req.header('X-Request-ID') || randomUUID(); 
  res.setHeader('X-Request-ID', req.id);
  next(); 
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 10000;

// Health check endpoints para observabilidade
app.get('/healthz', (_req, res) => res.json({ ok: true }));
app.get('/api/health', async (_req, res) => {
  const health = { 
    ok: true, 
    service: 'telemed-internal',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dependencies: {}
  };
  
  // Verificar conectividade do banco
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.dependencies.database = 'up';
  } catch (e) {
    health.dependencies.database = 'down';
    health.ok = false;
  }
  
  // Verificar presença da chave OpenAI (sem expor o valor)
  health.dependencies.openai = process.env.OPENAI_API_KEY ? 'configured' : 'missing';
  
  res.status(health.ok ? 200 : 503).json(health);
});

const requireToken = (req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  if (req.path === '/healthz' || req.path === '/api/health') return next(); // não exige token no health
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

app.listen(PORT, ()=>console.log('telemed-internal on', PORT));