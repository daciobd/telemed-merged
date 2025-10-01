import http from 'k6/http';
import { sleep, check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export let options = {
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
    escalate_rate: ['rate<0.30'],
  },
  scenarios: {
    steady: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 30 },
        { duration: '2m', target: 30 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
    spike_rate_limit: {
      executor: 'constant-vus',
      exec: 'spike',
      vus: 200,
      duration: '15s',
      startTime: '4m',
      gracefulStop: '5s',
    },
  },
};

const API_URL = __ENV.API_URL || 'http://localhost:3000/api/ai/answer';
const API_TOKEN = __ENV.API_TOKEN || '';
const escalateRate = new Rate('escalate_rate');
const durationTrend = new Trend('dr_ai_duration_ms');

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const QUESTIONS = [
  { q: 'Como devo tomar meu remédio conforme a última consulta?', expect: 'esclarecimento' },
  { q: 'Comecei a sentir tontura agora à noite', expect: 'escala_emergencia' },
  { q: 'Posso tomar dipirona junto?', expect: 'fora_escopo' },
  { q: 'Estou com dor no peito forte', expect: 'escala_emergencia' },
  { q: 'Poderia explicar a recomendação de exercícios?', expect: 'esclarecimento' },
];

export default function() {
  const payload = JSON.stringify({
    patientId: String(Math.floor(Math.random() * 1000) + 1),
    question: rand(QUESTIONS).q,
  });
  const headers = {
    'Content-Type': 'application/json',
    ...(API_TOKEN ? { 'Authorization': `Bearer ${API_TOKEN}` } : {}),
  };

  const res = http.post(API_URL, payload, { headers });
  durationTrend.add(res.timings.duration);

  let ok = check(res, {
    'status 200': (r) => r.status === 200,
    'json parse': (r) => {
      try { JSON.parse(r.body); return true; } catch { return false; }
    },
  });

  let tipo = 'erro';
  try {
    tipo = JSON.parse(res.body).tipo || 'erro';
  } catch (e) {}

  escalateRate.add(tipo !== 'esclarecimento');

  sleep(1);
}

export function spike() {
  const payload = JSON.stringify({
    patientId: 'rate-limit-test',
    question: 'Você pode repetir as mesmas orientações?',
  });
  const headers = {
    'Content-Type': 'application/json',
    ...(API_TOKEN ? { 'Authorization': `Bearer ${API_TOKEN}` } : {}),
  };
  const res = http.post(API_URL, payload, { headers });
  sleep(0.1);
}
