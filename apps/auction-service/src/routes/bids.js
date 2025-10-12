import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ---- Store in-memory (demo) ----
const bids = new Map();

// Fixture de médicos (varia por valor)
function mockDoctors(amountCents) {
  const high = amountCents >= 18000;
  const mid  = amountCents >= 16000;

  const base = [
    { 
      id: 'SP-123456', 
      name: 'Dr. Roberto Silva', 
      uf: 'SP', 
      crm: '123456', 
      specialty: 'cardiology', 
      priceCents: Math.max(18000, amountCents), 
      availability: high ? 'now' : (mid ? 'today' : 'tomorrow') 
    },
    { 
      id: 'RJ-234567', 
      name: 'Dra. Maria Santos', 
      uf: 'RJ', 
      crm: '234567', 
      specialty: 'general', 
      priceCents: Math.max(17000, amountCents), 
      availability: mid  ? 'today' : 'tomorrow' 
    },
    { 
      id: 'MG-345678', 
      name: 'Dr. João Oliveira', 
      uf: 'MG', 
      crm: '345678', 
      specialty: 'psychiatry', 
      priceCents: 19000, 
      availability: high ? 'now' : 'today' 
    },
    { 
      id: 'SP-456789', 
      name: 'Dra. Ana Costa', 
      uf: 'SP', 
      crm: '456789', 
      specialty: 'dermatology',
      priceCents: 20000, 
      availability: 'today' 
    }
  ];

  if (high)   return base;                  // 180+ → mostra todos, com 1–2 "now"
  if (mid)    return base.slice(0, 3);      // 160–179 → hoje/amanhã
  return [];                                // <160 → vazio (força aumentar lance)
}

// Health
router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'auction-service', ts: new Date().toISOString() });
});

// Criar bid
router.post('/bids', requireAuth, (req, res) => {
  const { patientId, specialty, amountCents, mode = 'immediate' } = req.body || {};
  if (!patientId || !specialty || !amountCents) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  const id = 'bid_' + Math.random().toString(36).slice(2, 10);
  const bid = { 
    id, 
    patientId, 
    specialty, 
    amountCents, 
    mode, 
    status: 'pending', 
    createdAt: new Date().toISOString() 
  };
  bids.set(id, bid);
  return res.json(bid);
});

// Detalhar bid
router.get('/bids/:id', requireAuth, (req, res) => {
  const bid = bids.get(req.params.id);
  if (!bid) return res.status(404).json({ error: 'not_found' });
  res.json(bid);
});

// Buscar médicos
router.post('/bids/:id/search', requireAuth, (req, res) => {
  const bid = bids.get(req.params.id);
  if (!bid) return res.status(404).json({ error: 'not_found' });

  const doctors = mockDoctors(bid.amountCents);
  const status = doctors.some(d => d.availability === 'now') ? 'found_immediate'
               : doctors.length ? 'found_scheduled'
               : 'not_found';

  bid.status = status;
  bid.updatedAt = new Date().toISOString();

  res.json({ doctors, status });
});

// Aumentar valor
router.put('/bids/:id/increase', requireAuth, (req, res) => {
  const bid = bids.get(req.params.id);
  if (!bid) return res.status(404).json({ error: 'not_found' });
  const { new_value } = req.body || {};
  if (!new_value || new_value <= bid.amountCents) {
    return res.status(400).json({ error: 'invalid_value' });
  }
  bid.amountCents = new_value;
  bid.status = 'pending';
  bid.updatedAt = new Date().toISOString();
  res.json({ id: bid.id, amountCents: bid.amountCents, status: bid.status });
});

// Aceitar médico
router.post('/bids/:id/accept', requireAuth, (req, res) => {
  const bid = bids.get(req.params.id);
  if (!bid) return res.status(404).json({ error: 'not_found' });
  const { doctorId } = req.body || {};
  if (!doctorId) return res.status(400).json({ error: 'missing_doctor_id' });

  bid.status = 'accepted';
  bid.updatedAt = new Date().toISOString();

  return res.json({
    id: 'appt_' + Math.random().toString(36).slice(2, 10),
    bidId: bid.id,
    physicianId: doctorId,
    isImmediate: true,
    scheduledAt: new Date().toISOString()
  });
});

export default router;
