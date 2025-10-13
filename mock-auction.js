import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.MOCK_PORT || 3333;

// Armazenamento em memória
const bids = new Map();
const doctors = {
  immediate: [
    { id: 'D1', name: 'Dr. Silva', specialty: 'Clínica Geral', crm: 'CRM 12345-SP' },
    { id: 'D2', name: 'Dra. Santos', specialty: 'Pediatria', crm: 'CRM 67890-RJ' },
    { id: 'D3', name: 'Dr. Costa', specialty: 'Cardiologia', crm: 'CRM 11223-MG' },
  ],
  scheduled: [
    { id: 'D5', name: 'Dr. Braga', specialty: 'Ortopedia', time: '+45 min', crm: 'CRM 33445-SP' },
    { id: 'D6', name: 'Dra. Lima', specialty: 'Dermatologia', time: '+90 min', crm: 'CRM 55667-RJ' },
    { id: 'D7', name: 'Dr. Luiz', specialty: 'Neurologia', time: '+120 min', crm: 'CRM 77889-MG' },
    { id: 'D8', name: 'Dra. Melo', specialty: 'Psiquiatria', time: '+150 min', crm: 'CRM 99001-SP' },
    { id: 'D9', name: 'Dr. Souza', specialty: 'Urologia', time: '+30 min', crm: 'CRM 22334-RJ' },
    { id: 'D10', name: 'Dra. Maia', specialty: 'Ginecologia', time: '+60 min', crm: 'CRM 44556-MG' },
  ],
};

app.use(cors());
app.use(express.json());

// Telemetria console bonita
const logRequest = (method, path, data) => {
  console.group(`\n🎯 [MOCK AUCTION] ${method} ${path}`);
  console.table(data);
  console.groupEnd();
};

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'mock-auction', port: PORT });
});

// POST /api/auction/bids - Criar bid
app.post('/api/auction/bids', (req, res) => {
  const { amount } = req.body;
  const bidId = `BID-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  
  const bid = {
    id: bidId,
    amount: Number(amount) || 140,
    created_at: new Date().toISOString(),
    status: 'active',
  };
  
  bids.set(bidId, bid);
  
  logRequest('POST', '/api/auction/bids', { bidId, amount: bid.amount });
  
  res.json({
    ok: true,
    bid: {
      id: bid.id,
      amount: bid.amount,
    },
  });
});

// POST /api/auction/search - Buscar médicos (usa bid_id no body)
app.post('/api/auction/search', (req, res) => {
  const { bid_id } = req.body;
  
  if (!bid_id) {
    return res.status(400).json({ ok: false, error: 'bid_id é obrigatório' });
  }
  
  const bid = bids.get(bid_id);
  if (!bid) {
    return res.status(404).json({ ok: false, error: 'Bid não encontrado' });
  }
  
  const amount = bid.amount;
  
  // Regras de negócio da demo:
  // >= 180: imediatos + agendados
  // >= 160: só agendados
  // < 160: nenhum
  
  let immediate_doctors = [];
  let scheduled_doctors = [];
  
  if (amount >= 180) {
    immediate_doctors = doctors.immediate;
    scheduled_doctors = doctors.scheduled;
  } else if (amount >= 160) {
    immediate_doctors = [];
    scheduled_doctors = doctors.scheduled;
  }
  
  logRequest('POST', '/api/auction/search', {
    bid_id,
    amount,
    immediate: immediate_doctors.length,
    scheduled: scheduled_doctors.length,
  });
  
  res.json({
    ok: true,
    bid: {
      id: bid.id,
      amount: bid.amount,
    },
    immediate_doctors,
    scheduled_doctors,
  });
});

// PUT /api/auction/bids/:id/increase - Aumentar proposta
app.put('/api/auction/bids/:id/increase', (req, res) => {
  const { id } = req.params;
  const { increase_amount } = req.body;
  
  const bid = bids.get(id);
  if (!bid) {
    return res.status(404).json({ ok: false, error: 'Bid não encontrado' });
  }
  
  const increaseValue = Number(increase_amount) || 20;
  bid.amount += increaseValue;
  bid.updated_at = new Date().toISOString();
  
  logRequest('PUT', `/api/auction/bids/${id}/increase`, {
    bid_id: id,
    old_amount: bid.amount - increaseValue,
    new_amount: bid.amount,
    increase: increaseValue,
  });
  
  res.json({
    ok: true,
    bid: {
      id: bid.id,
      amount: bid.amount,
    },
  });
});

// POST /api/auction/accept - Aceitar médico
app.post('/api/auction/accept', (req, res) => {
  const { bid_id, doctor_id } = req.body;
  
  if (!bid_id || !doctor_id) {
    return res.status(400).json({ 
      ok: false, 
      error: 'bid_id e doctor_id são obrigatórios' 
    });
  }
  
  const bid = bids.get(bid_id);
  if (!bid) {
    return res.status(404).json({ ok: false, error: 'Bid não encontrado' });
  }
  
  const consultation_id = `CONS-${doctor_id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  bid.status = 'accepted';
  bid.doctor_id = doctor_id;
  bid.consultation_id = consultation_id;
  bid.accepted_at = new Date().toISOString();
  
  logRequest('POST', '/api/auction/accept', {
    bid_id,
    doctor_id,
    consultation_id,
    amount: bid.amount,
  });
  
  res.json({
    ok: true,
    consultation_id,
    doctor_id,
    bid: {
      id: bid.id,
      amount: bid.amount,
    },
  });
});

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ 
    ok: false, 
    error: 'Endpoint não encontrado',
    available: [
      'GET /health',
      'POST /api/auction/bids',
      'POST /api/auction/search',
      'PUT /api/auction/bids/:id/increase',
      'POST /api/auction/accept',
    ],
  });
});

app.listen(PORT, () => {
  console.log('\n🚀 ======================================');
  console.log(`   MOCK AUCTION SERVER`);
  console.log(`   Porta: ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log('🚀 ======================================\n');
});
