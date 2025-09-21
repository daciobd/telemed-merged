import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
const INTERNAL_URL_TELEMED = (process.env.INTERNAL_URL_TELEMED || '').replace(/\/$/, '');
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || '';

app.use(express.json());
// Patch 6: CORS configurado para BID funcionar
app.use(cors({
  origin: ['https://telemed-deploy-ready.onrender.com'],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Internal-Token"]
}));

// Health checks (público)
app.get('/healthz', (_req,res)=>res.json({ok:true}));
app.get('/health', (_req,res)=>res.json({ok:true}));

// Root endpoint para resolver 404
app.get('/', (_req,res)=>res.json({
  service: 'telemed-auction',
  status: 'running',
  endpoints: ['/healthz', '/bids', '/bids/:id/accept'],
  version: '1.0.0'
}));

// Padronizado: /api/health
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: process.env.SERVICE_NAME || 'telemed-auction',
    time: new Date().toISOString()
  });
});

// Criar BID (agora aceita specialty)
app.post('/bids', async (req,res) => {
  try {
    const { patientId, amountCents, mode, specialty } = req.body || {};
    if (!patientId || !amountCents || !mode) {
      return res.status(400).json({ ok:false, error:'patientId, amountCents e mode são obrigatórios' });
    }
    const bid = await prisma.bid.create({
      data: {
        patientId,
        amountCents: Number(amountCents),
        mode: String(mode),
        specialty: specialty ? String(specialty) : null,
        status: 'open',
        // opcional: expiresAt com base no mode
      }
    });
    res.json({ ok:true, bid });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:'failed_to_create_bid' });
  }
});

// Aceitar BID → busca médico por especialidade no internal e cria Appointment
app.post('/bids/:id/accept', async (req,res) => {
  try {
    const { id } = req.params;
    const { patientId: bodyPatientId, physicianId: forcedPhysicianId } = req.body || {};

    const bid = await prisma.bid.findUnique({ where: { id } });
    if (!bid) return res.status(404).json({ ok:false, error:'bid_not_found' });
    if (bid.status !== 'open') return res.status(400).json({ ok:false, error:'bid_not_open' });

    const patientId = bodyPatientId || bid.patientId;

    let physicianId = forcedPhysicianId || null;

    // Se não veio physicianId mas o BID tem specialty, tenta buscar no internal
    if (!physicianId && bid.specialty && INTERNAL_URL_TELEMED) {
      try {
        const url = `${INTERNAL_URL_TELEMED}/internal/physicians/search?specialty=${encodeURIComponent(bid.specialty)}&availableNow=true`;
        const r = await fetch(url, {
          headers: { 'Authorization': `Bearer ${INTERNAL_TOKEN}` }
        });
        if (r.ok) {
          const data = await r.json(); // { ok:true, physicians:[{id,...}] }
          const list = Array.isArray(data?.physicians) ? data.physicians : [];
          if (list.length) {
            // seleção simples: primeiro da lista
            physicianId = list[0].id;
          }
        }
      } catch (e) {
        console.warn('internal physician search failed', e?.message);
      }
    }

    // Cria appointment via internal
    if (!INTERNAL_URL_TELEMED) {
      return res.status(500).json({ ok:false, error:'INTERNAL_URL_TELEMED_missing' });
    }

    const payload = {
      bidId: bid.id,
      patientId,
      mode: bid.mode,
      physicianId: physicianId || undefined, // opcional
      origin: 'auction'
    };

    const r2 = await fetch(`${INTERNAL_URL_TELEMED}/internal/appointments/from-bid`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERNAL_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!r2.ok) {
      const txt = await r2.text().catch(()=> '');
      return res.status(502).json({ ok:false, error:'internal_failed', details: txt });
    }
    const out = await r2.json();

    // marca o BID como aceito
    await prisma.bid.update({
      where: { id: bid.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
        physicianId: physicianId || null
      }
    });

    res.json({ ok:true, appointment: out?.appointment || null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:'accept_failed' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Starting TeleMed Auction Service...`);
  console.log(`[${process.env.SERVICE_NAME || 'telemed-auction'}] listening on :${PORT}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: PORT,
    CORS_ORIGINS: 'all origins allowed',
    INTERNAL_TOKEN: process.env.INTERNAL_TOKEN ? 'configured' : 'NOT SET',
    INTERNAL_URL_TELEMED: process.env.INTERNAL_URL_TELEMED ? 'configured' : 'NOT SET'
  });
});
