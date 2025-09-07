// Testes E2E estáveis para MDA - Gates de Produção
import { test, expect } from '@playwright/test';
import WebSocket from 'ws';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8080';
const JWT_TOKEN = process.env.TEST_JWT_TOKEN || 'mock-jwt-token';

// Suite de testes E2E estáveis
test.describe('MDA Production Gates', () => {
  
  test.describe('Smoke Tests (Gate 1)', () => {
    test('GET /api/mda/health should return 200', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/mda/health`);
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.service).toContain('medical-desk-advanced');
    });

    test('POST /api/mda/ai/analyze-symptoms should return 200', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/mda/ai/analyze-symptoms`, {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        data: {
          symptoms: ['febre', 'dor de cabeça'],
          patientAge: 30,
          urgency: false
        }
      });
      
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBeDefined();
      expect(body.analysis || body.mockData).toBeDefined();
    });

    test('POST /api/mda/ai/intelligent-prescription should return 200', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/mda/ai/intelligent-prescription`, {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        data: {
          symptoms: ['febre'],
          diagnosis: 'viral',
          patientProfile: { age: 30, weight: 70 }
        }
      });
      
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBeDefined();
      expect(body.prescription || body.mockData).toBeDefined();
    });
  });

  test.describe('WebSocket Tests (Gate 1)', () => {
    test('WS /ws should connect and receive hello', async () => {
      const wsUrl = BASE_URL.replace('http', 'ws') + '/ws';
      
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        let messageReceived = false;
        
        ws.on('open', () => {
          console.log('WebSocket connected');
        });
        
        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'hello') {
            expect(message.service).toBe('medical-desk-advanced');
            messageReceived = true;
            ws.close();
            resolve();
          }
        });
        
        ws.on('close', () => {
          if (messageReceived) {
            resolve();
          } else {
            reject(new Error('WebSocket closed without receiving hello message'));
          }
        });
        
        ws.on('error', (error) => {
          reject(new Error(`WebSocket error: ${error.message}`));
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (!messageReceived) {
            ws.close();
            reject(new Error('WebSocket hello message timeout'));
          }
        }, 5000);
      });
    });
  });

  test.describe('Security Tests (Gate)', () => {
    test('Should reject requests without JWT token', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/mda/ai/analyze-symptoms`, {
        headers: { 'Content-Type': 'application/json' },
        data: { symptoms: ['test'] }
      });
      
      expect(response.status()).toBe(401);
      
      const body = await response.json();
      expect(body.error).toContain('token');
    });

    test('Should reject invalid JWT token', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/mda/ai/analyze-symptoms`, {
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json'
        },
        data: { symptoms: ['test'] }
      });
      
      expect(response.status()).toBe(401);
    });

    test('Should not expose sensitive data in error responses', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/mda/ai/analyze-symptoms`, {
        headers: { 'Content-Type': 'application/json' },
        data: { 
          symptoms: ['test'],
          patientCPF: '123.456.789-00',
          patientEmail: 'patient@test.com'
        }
      });
      
      const body = await response.text();
      expect(body).not.toContain('123.456.789-00');
      expect(body).not.toContain('patient@test.com');
    });
  });

  test.describe('Performance Tests (Gate)', () => {
    test('Health check should respond under 100ms', async ({ request }) => {
      const start = Date.now();
      const response = await request.get(`${BASE_URL}/api/mda/health`);
      const duration = Date.now() - start;
      
      expect(response.status()).toBe(200);
      expect(duration).toBeLessThan(100);
    });

    test('AI analysis should respond under 2s', async ({ request }) => {
      const start = Date.now();
      const response = await request.post(`${BASE_URL}/api/mda/ai/analyze-symptoms`, {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        data: { symptoms: ['febre'] }
      });
      const duration = Date.now() - start;
      
      expect(response.status()).toBe(200);
      expect(duration).toBeLessThan(2000);
    });
  });

  test.describe('Feature Flag Tests (Gate)', () => {
    test('Should return feature status in config endpoint', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/mda/config`);
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.enabled).toBeDefined();
      expect(body.features).toBeDefined();
      expect(body.fallbacks).toBeDefined();
    });
  });
});

// Testes de estabilidade (executar 3 vezes seguidas)
test.describe('Stability Tests (3x execution)', () => {
  for (let i = 1; i <= 3; i++) {
    test(`Execution ${i}/3 - Full smoke test`, async ({ request }) => {
      // Health check
      let response = await request.get(`${BASE_URL}/api/mda/health`);
      expect(response.status()).toBe(200);
      
      // AI analysis
      response = await request.post(`${BASE_URL}/api/mda/ai/analyze-symptoms`, {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        data: { symptoms: ['febre'] }
      });
      expect(response.status()).toBe(200);
      
      // Prescription
      response = await request.post(`${BASE_URL}/api/mda/ai/intelligent-prescription`, {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        data: { symptoms: ['febre'], diagnosis: 'viral' }
      });
      expect(response.status()).toBe(200);
      
      console.log(`✅ Execution ${i}/3 passed`);
    });
  }
});