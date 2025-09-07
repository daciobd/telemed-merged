// Teste de carga para MDA - Gate de Performance
import { check, sleep } from 'k6';
import http from 'k6/http';
import ws from 'k6/ws';
import { Rate, Trend, Counter } from 'k6/metrics';

// Métricas customizadas
const errorRate = new Rate('errors');
const latencyTrend = new Trend('latency');
const requestCounter = new Counter('requests');

// Configurações do teste
export let options = {
  stages: [
    { duration: '2m', target: 10 },   // Warm up
    { duration: '5m', target: 50 },   // Ramp up to 50 RPS
    { duration: '10m', target: 100 }, // Stay at 100 RPS for 10 min
    { duration: '2m', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'], // p95 < 400ms
    errors: ['rate<0.01'],            // Error rate < 1%
    http_req_failed: ['rate<0.01'],   // Failed requests < 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const JWT_TOKEN = __ENV.JWT_TOKEN || 'test-jwt-token';

// Headers padrão
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${JWT_TOKEN}`,
};

// Dados de teste
const testSymptoms = [
  ['febre', 'dor de cabeça'],
  ['náusea', 'vômito'],
  ['dor no peito', 'falta de ar'],
  ['dor abdominal', 'diarreia'],
  ['tontura', 'fraqueza'],
];

const testPrescriptions = [
  { symptoms: ['febre'], diagnosis: 'viral' },
  { symptoms: ['dor de cabeça'], diagnosis: 'tensional' },
  { symptoms: ['náusea'], diagnosis: 'gastrite' },
  { symptoms: ['dor no peito'], diagnosis: 'ansiedade' },
  { symptoms: ['dor abdominal'], diagnosis: 'gastroenterite' },
];

export default function () {
  // Teste 1: Health check (deve ser rápido)
  group('Health Check', () => {
    const response = http.get(`${BASE_URL}/api/mda/health`);
    
    check(response, {
      'health check status is 200': (r) => r.status === 200,
      'health check response time < 100ms': (r) => r.timings.duration < 100,
      'health check has correct body': (r) => {
        const body = JSON.parse(r.body);
        return body.ok === true && body.service;
      },
    });
    
    errorRate.add(response.status >= 400);
    latencyTrend.add(response.timings.duration);
    requestCounter.add(1);
  });
  
  // Teste 2: AI Analysis (endpoint principal)
  group('AI Analysis', () => {
    const symptoms = testSymptoms[Math.floor(Math.random() * testSymptoms.length)];
    const payload = JSON.stringify({
      symptoms,
      patientAge: Math.floor(Math.random() * 80) + 18,
      urgency: Math.random() > 0.8
    });
    
    const response = http.post(`${BASE_URL}/api/mda/ai/analyze-symptoms`, payload, { headers });
    
    check(response, {
      'ai analysis status is 200': (r) => r.status === 200,
      'ai analysis response time < 2000ms': (r) => r.timings.duration < 2000,
      'ai analysis has valid response': (r) => {
        const body = JSON.parse(r.body);
        return body.success !== undefined && (body.analysis || body.mockData);
      },
    });
    
    errorRate.add(response.status >= 400);
    latencyTrend.add(response.timings.duration);
    requestCounter.add(1);
  });
  
  // Teste 3: Intelligent Prescription
  group('Intelligent Prescription', () => {
    const prescriptionData = testPrescriptions[Math.floor(Math.random() * testPrescriptions.length)];
    const payload = JSON.stringify({
      ...prescriptionData,
      patientProfile: {
        age: Math.floor(Math.random() * 60) + 20,
        weight: Math.floor(Math.random() * 50) + 50,
      }
    });
    
    const response = http.post(`${BASE_URL}/api/mda/ai/intelligent-prescription`, payload, { headers });
    
    check(response, {
      'prescription status is 200': (r) => r.status === 200,
      'prescription response time < 3000ms': (r) => r.timings.duration < 3000,
      'prescription has valid response': (r) => {
        const body = JSON.parse(r.body);
        return body.success !== undefined && (body.prescription || body.mockData);
      },
    });
    
    errorRate.add(response.status >= 400);
    latencyTrend.add(response.timings.duration);
    requestCounter.add(1);
  });
  
  // Teste 4: Telemedicine Session
  group('Telemedicine Session', () => {
    const payload = JSON.stringify({
      consultationId: Math.floor(Math.random() * 1000) + 1,
      patientId: `patient-${Math.floor(Math.random() * 100) + 1}`
    });
    
    const response = http.post(`${BASE_URL}/api/mda/telemedicine/sessions`, payload, { headers });
    
    check(response, {
      'session status is 200': (r) => r.status === 200,
      'session response time < 1000ms': (r) => r.timings.duration < 1000,
      'session has valid response': (r) => {
        const body = JSON.parse(r.body);
        return body.success !== undefined && (body.session || body.mockData);
      },
    });
    
    errorRate.add(response.status >= 400);
    latencyTrend.add(response.timings.duration);
    requestCounter.add(1);
  });
  
  // Teste 5: WebSocket Connection (apenas 10% dos usuários)
  if (Math.random() < 0.1) {
    group('WebSocket', () => {
      const wsUrl = BASE_URL.replace('http', 'ws') + '/ws';
      
      const response = ws.connect(wsUrl, function (socket) {
        let messageReceived = false;
        
        socket.on('open', () => {
          socket.send(JSON.stringify({ type: 'ping', data: 'load-test' }));
        });
        
        socket.on('message', (data) => {
          const message = JSON.parse(data);
          if (message.type === 'hello' || message.type === 'pong') {
            messageReceived = true;
          }
        });
        
        socket.setTimeout(() => {
          if (!messageReceived) {
            console.log('WebSocket timeout - no message received');
          }
          socket.close();
        }, 5000);
      });
      
      check(response, {
        'websocket connected successfully': (r) => r && r.status === 101,
      });
    });
  }
  
  // Pausa entre requests (simular comportamento real)
  sleep(Math.random() * 2 + 1); // 1-3 segundos
}

// Teste específico de stress (executar separadamente)
export function stressTest() {
  // Configuração de stress
  const stressOptions = {
    stages: [
      { duration: '1m', target: 200 },  // Ramp up to 200 RPS
      { duration: '5m', target: 300 },  // Stress at 300 RPS
      { duration: '1m', target: 0 },    // Cool down
    ],
    thresholds: {
      http_req_duration: ['p(95)<1000'], // Mais relaxado no stress
      errors: ['rate<0.05'],             // Até 5% de erro no stress
      http_req_failed: ['rate<0.05'],
    },
  };
  
  // Executar apenas health checks no stress test
  const response = http.get(`${BASE_URL}/api/mda/health`);
  check(response, {
    'stress test - health check works': (r) => r.status === 200,
  });
  
  errorRate.add(response.status >= 400);
  requestCounter.add(1);
}

// Teste de spike (picos de tráfego)
export function spikeTest() {
  const spikeOptions = {
    stages: [
      { duration: '30s', target: 50 },   // Normal load
      { duration: '30s', target: 500 },  // Spike to 500 RPS
      { duration: '30s', target: 50 },   // Back to normal
    ],
  };
  
  // Mix de endpoints durante spike
  const endpoints = [
    () => http.get(`${BASE_URL}/api/mda/health`),
    () => http.get(`${BASE_URL}/api/mda/stats`),
    () => http.get(`${BASE_URL}/api/mda/config`),
  ];
  
  const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const response = randomEndpoint();
  
  check(response, {
    'spike test - endpoint responds': (r) => r.status < 500,
  });
  
  errorRate.add(response.status >= 400);
  requestCounter.add(1);
}

// Relatório de resultados
export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
╔══════════════════════════════════════════════════════════════╗
║                     MDA LOAD TEST RESULTS                   ║
╠══════════════════════════════════════════════════════════════╣
║ Total Requests: ${data.metrics.requests.values.count}
║ Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%
║ Average Latency: ${data.metrics.latency.values.avg.toFixed(2)}ms
║ P95 Latency: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
║ 
║ GATES STATUS:
║ ${data.metrics['errors'].values.rate < 0.01 ? '✅' : '❌'} Error Rate < 1%: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%
║ ${data.metrics.http_req_duration.values['p(95)'] < 400 ? '✅' : '❌'} P95 < 400ms: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
║ 
║ RESULT: ${data.metrics.errors.values.rate < 0.01 && data.metrics.http_req_duration.values['p(95)'] < 400 ? '✅ PASSED' : '❌ FAILED'}
╚══════════════════════════════════════════════════════════════╝
    `,
  };
}