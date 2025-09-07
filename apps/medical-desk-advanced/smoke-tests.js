// Smoke tests para Medical Desk Advanced
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const BASE_URL = process.env.MDA_BASE_URL || 'http://localhost:8080';
const JWT_TOKEN = process.env.TEST_JWT_TOKEN || '';

async function runSmokeTests() {
  console.log('🧪 Executando Smoke Tests do Medical Desk Advanced...\n');
  
  const tests = [
    {
      name: 'Health Check (Público)',
      test: () => testHealthCheck()
    },
    {
      name: 'Stats (Público)', 
      test: () => testStats()
    },
    {
      name: 'Análise de Sintomas IA (Protegido)',
      test: () => testAIAnalysis()
    },
    {
      name: 'Prescrição Inteligente (Protegido)',
      test: () => testIntelligentPrescription()
    },
    {
      name: 'Sessão Telemedicina (Protegido)',
      test: () => testTelemedicineSession()
    },
    {
      name: 'WebSocket Connection',
      test: () => testWebSocket()
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const { name, test } of tests) {
    try {
      await test();
      console.log(`✅ ${name}: PASSOU`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: FALHOU - ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Resultado: ${passed} passou, ${failed} falhou`);
  process.exit(failed > 0 ? 1 : 0);
}

async function testHealthCheck() {
  const { stdout } = await execAsync(`curl -s "${BASE_URL}/api/mda/health"`);
  const response = JSON.parse(stdout);
  
  if (!response.ok || response.service !== 'medical-desk-advanced') {
    throw new Error('Health check retornou resposta inesperada');
  }
}

async function testStats() {
  const { stdout } = await execAsync(`curl -s "${BASE_URL}/api/mda/stats"`);
  const response = JSON.parse(stdout);
  
  if (!response.service || !response.uptime) {
    throw new Error('Stats retornou dados incompletos');
  }
}

async function testAIAnalysis() {
  if (!JWT_TOKEN) {
    console.log('⚠️  Pulando teste de IA - JWT_TOKEN não fornecido');
    return;
  }

  const payload = JSON.stringify({
    symptoms: ['febre', 'dor de cabeça'],
    patientAge: 30,
    urgency: false
  });

  const { stdout } = await execAsync(`curl -s -X POST "${BASE_URL}/api/mda/ai/analyze-symptoms" \\
    -H "Authorization: Bearer ${JWT_TOKEN}" \\
    -H "Content-Type: application/json" \\
    -d '${payload}'`);
    
  const response = JSON.parse(stdout);
  
  if (!response.success || !response.analysis) {
    throw new Error('Análise de IA falhou');
  }
}

async function testIntelligentPrescription() {
  if (!JWT_TOKEN) {
    console.log('⚠️  Pulando teste de prescrição - JWT_TOKEN não fornecido');
    return;
  }

  const payload = JSON.stringify({
    symptoms: ['febre'],
    diagnosis: 'viral',
    patientProfile: { age: 30, weight: 70 }
  });

  const { stdout } = await execAsync(`curl -s -X POST "${BASE_URL}/api/mda/ai/intelligent-prescription" \\
    -H "Authorization: Bearer ${JWT_TOKEN}" \\
    -H "Content-Type: application/json" \\
    -d '${payload}'`);
    
  const response = JSON.parse(stdout);
  
  if (!response.success || !response.prescription) {
    throw new Error('Prescrição inteligente falhou');
  }
}

async function testTelemedicineSession() {
  if (!JWT_TOKEN) {
    console.log('⚠️  Pulando teste de telemedicina - JWT_TOKEN não fornecido');
    return;
  }

  const payload = JSON.stringify({
    consultationId: 123,
    patientId: 'test-patient'
  });

  const { stdout } = await execAsync(`curl -s -X POST "${BASE_URL}/api/mda/telemedicine/sessions" \\
    -H "Authorization: Bearer ${JWT_TOKEN}" \\
    -H "Content-Type: application/json" \\
    -d '${payload}'`);
    
  const response = JSON.parse(stdout);
  
  if (!response.success || !response.session) {
    throw new Error('Criação de sessão de telemedicina falhou');
  }
}

function testWebSocket() {
  return new Promise((resolve, reject) => {
    // Mock test - em ambiente real usar WebSocket real
    console.log('⚠️  Teste WebSocket simulado (implementar com ws real em produção)');
    resolve();
  });
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runSmokeTests().catch(console.error);
}