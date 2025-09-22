import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
const INTERNAL_URL_TELEMED = (process.env.INTERNAL_URL_TELEMED || '').replace(/\/$/, '');
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || '';

app.use(express.json());
app.use(cors({
  origin: ['https://telemed-deploy-ready.onrender.com'],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Internal-Token"]
}));

// Health check endpoint
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Padronized health endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: process.env.SERVICE_NAME || 'telemed-auction',
    time: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'telemed-auction',
    status: 'running',
    endpoints: ['/healthz', '/api/health', '/bids', '/bids/:id/accept']
  });
});

// Create BID (now accepts specialty)
app.post('/bids', async (req, res) => {
  try {
    const { patientId, amountCents, mode, specialty } = req.body || {};
    if (!patientId || !amountCents || !mode) {
      return res.status(400).json({ ok: false, error: 'patientId, amountCents e mode são obrigatórios' });
    }
    const bid = await prisma.bid.create({
      data: {
        patientId,
        amountCents: Number(amountCents),
        mode: String(mode),
        specialty: specialty ? String(specialty) : null,
        status: 'open',
      }
    });
    res.json({ ok: true, bid });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'failed_to_create_bid' });
  }
});

// Accept BID → search physician by specialty in internal and create Appointment
app.post('/bids/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { patientId: bodyPatientId, physicianId: forcedPhysicianId } = req.body || {};

    const bid = await prisma.bid.findUnique({ where: { id } });
    if (!bid) return res.status(404).json({ ok: false, error: 'bid_not_found' });
    if (bid.status !== 'open') return res.status(400).json({ ok: false, error: 'bid_not_open' });

    const patientId = bodyPatientId || bid.patientId;
    let physicianId = forcedPhysicianId || null;

    // If no physicianId but BID has specialty, try searching in internal
    if (!physicianId && bid.specialty && INTERNAL_URL_TELEMED) {
      try {
        const url = `${INTERNAL_URL_TELEMED}/internal/physicians/search?specialty=${encodeURIComponent(bid.specialty)}&availableNow=true`;
        const r = await fetch(url, {
          headers: { 'Authorization': `Bearer ${INTERNAL_TOKEN}` }
        });
        if (r.ok) {
          const data = await r.json();
          const list = Array.isArray(data?.physicians) ? data.physicians : [];
          if (list.length) {
            physicianId = list[0].id;
          }
        }
      } catch (e) {
        console.warn('internal physician search failed', e?.message);
      }
    }

    // Create appointment via internal
    if (!INTERNAL_URL_TELEMED) {
      return res.status(500).json({ ok: false, error: 'INTERNAL_URL_TELEMED_missing' });
    }

    const payload = {
      bidId: bid.id,
      patientId,
      mode: bid.mode,
      physicianId: physicianId || undefined,
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
      const txt = await r2.text().catch(() => '');
      return res.status(502).json({ ok: false, error: 'internal_failed', details: txt });
    }
    const out = await r2.json();

    // Mark BID as accepted
    await prisma.bid.update({
      where: { id: bid.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
        physicianId: physicianId || null
      }
    });

    res.json({ ok: true, appointment: out?.appointment || null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'accept_failed' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Starting TeleMed Auction Service...`);
  console.log(`[${process.env.SERVICE_NAME || 'telemed-auction'}] listening on :${PORT}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: PORT,
    CORS_ORIGINS: 'telemed-deploy-ready.onrender.com',
    INTERNAL_TOKEN: process.env.INTERNAL_TOKEN ? 'configured' : 'NOT SET',
    INTERNAL_URL_TELEMED: process.env.INTERNAL_URL_TELEMED ? 'configured' : 'NOT SET'
  });
});