import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const app = express();
app.use(cors({ origin: '*', exposedHeaders: ['*'] }));
app.use(express.json());

const prisma = new PrismaClient();
const PORT = process.env.PORT || 10000;

app.get('/healthz', (_req,res)=>res.json({ok:true}));

const requireToken = (req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  if (req.path === '/healthz') return next();    // não exige token no health
  const tok = req.header('X-Internal-Token');
  if (!tok || tok !== (process.env.INTERNAL_TOKEN || '')) {
    return res.status(401).json({ error: 'invalid token' });
  }
  next();
};

// protege tudo a seguir (exceto /healthz)
app.use(requireToken);

// 1) ping simples (não usa OpenAI) — valida token/CORS
app.post('/ai/echo', (req, res) => {
  res.json({ ok: true, echo: req.body || null, ts: Date.now() });
});

// 2) completion real com OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/ai/complete', async (req, res) => {
  try {
    const { messages = [{ role: 'user', content: 'Diga "ok".' }], model = 'gpt-4o-mini' } = req.body || {};
    const out = await openai.chat.completions.create({ model, messages, stream: false });
    res.json({ ok: true, id: out.id, content: out.choices?.[0]?.message?.content || '' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// ===== Physicians =====

// Cadastro/atualização de médico (usado pelo cadastro-medico.html)
app.post('/physicians', async (req,res)=>{
  try {
    const { id, crm, uf, name, specialty, phone, email, notes } = req.body || {};
    if (!id) return res.status(400).json({ok:false, error:'id_required'});
    const phy = await prisma.physician.upsert({
      where: { id },
      create: { id, crm, uf, name, specialty, availableNow: true },
      update: { crm, uf, name, specialty, availableNow: true }
    });
    res.json({ ok:true, physician: phy });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:'physician_upsert_failed' });
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
    res.json({ ok:true, physicians });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:'physician_search_failed' });
  }
});

// ===== Appointments =====

// Cria consulta a partir de um BID (leia specialty via physicianId já resolvido no auction)
app.post('/internal/appointments/from-bid', async (req,res)=>{
  try {
    const { bidId, patientId, physicianId, mode } = req.body || {};
    if (!bidId || !patientId) {
      return res.status(400).json({ ok:false, error:'bidId_and_patientId_required' });
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
    res.json({ ok:true, appointment: appt });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:'create_from_bid_failed' });
  }
});

app.listen(PORT, ()=>console.log('telemed-internal on', PORT));