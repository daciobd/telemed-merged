import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 10000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || '';

app.use(express.json());
app.use(cors({
  origin: FRONTEND_ORIGIN === '*' ? true : FRONTEND_ORIGIN.split(',').map(s => s.trim())
}));

app.get('/healthz', (_req,res)=>res.json({ok:true}));

// Middleware simples de auth interna (Bearer INTERNAL_TOKEN)
function internalAuth(req,res,next){
  const ah = req.headers.authorization || '';
  if (!INTERNAL_TOKEN) return res.status(500).json({ok:false, error:'INTERNAL_TOKEN_missing'});
  if (!ah.startsWith('Bearer ')) return res.status(401).json({ok:false, error:'no_bearer'});
  const token = ah.slice(7);
  if (token !== INTERNAL_TOKEN) return res.status(401).json({ok:false, error:'bad_token'});
  next();
}

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
app.get('/internal/physicians/search', internalAuth, async (req,res)=>{
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
app.post('/internal/appointments/from-bid', internalAuth, async (req,res)=>{
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