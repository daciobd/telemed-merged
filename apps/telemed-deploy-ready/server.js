const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URLSearchParams } = require('url');

// In-memory storage for drafts (usar banco real em produção)
const drafts = new Map();

// Mock data para PHR
const mockPHRData = {
  'PAT-123': {
    patient: { name: 'João Silva', age: 54, sex: 'Masculino', phone: '(11) 99999-9999' },
    consultations: [
      { date: '2024-01-15', doctor: 'Dr. Maria Santos', diagnosis: 'Hipertensão arterial', notes: 'Pressão controlada' },
      { date: '2024-01-10', doctor: 'Dr. Pedro Lima', diagnosis: 'Consulta de rotina', notes: 'Exames em dia' }
    ],
    exams: [
      { date: '2024-01-12', type: 'Hemograma completo', result: 'Normal', doctor: 'Dr. Ana Costa' },
      { date: '2024-01-08', type: 'Radiografia de tórax', result: 'Sem alterações', doctor: 'Dr. Carlos Souza' }
    ],
    allergies: ['Penicilina', 'Dipirona'],
    meds: [
      { name: 'Losartana 50mg', frequency: '1x/dia', duration: 'Uso contínuo' },
      { name: 'Sinvastatina 20mg', frequency: '1x/dia à noite', duration: 'Uso contínuo' }
    ]
  },
  '3335602': {
    idPersona: '3335602',
    nomeCompleto: 'Dheliciane Da Silva Costa',
    cpf: '03262894370',
    idade: 36,
    nascimento: '1988-09-23',
    genero: 'Feminino',
    patient: { name: 'Dheliciane Da Silva Costa', age: 36, sex: 'Feminino', phone: '(11) 98765-4321' },
    eventos: [
      { id: 'ev1', tipo: 'VIDEO_CONSULTA', titulo: 'Clínica Geral', data: '2025-08-04T12:00:00Z', profissional: 'Dr. A' }
    ],
    consultations: [
      { date: '2024-08-01', doctor: 'Dr. A', diagnosis: 'Consulta clínica', notes: 'Paciente apresentando bom estado geral' },
      { date: '2024-07-15', doctor: 'Dr. B', diagnosis: 'Acompanhamento de rotina', notes: 'Pressão arterial controlada' }
    ],
    exams: [
      { date: '2024-07-20', type: 'Hemograma completo', result: 'Valores dentro da normalidade', doctor: 'Dr. A' },
      { date: '2024-07-10', type: 'Glicemia de jejum', result: '95 mg/dL - Normal', doctor: 'Dr. B' }
    ],
    allergies: [],
    meds: [
      { name: 'Vitamina D 2000UI', frequency: '1x/dia', duration: '3 meses' }
    ]
  },
  '4537263': {
    idPersona: '4537263',
    nomeCompleto: 'Hadassa Da Silva Santos Garcia',
    cpf: '14109089760',
    idade: 34,
    nascimento: '1991-07-01',
    genero: 'Feminino',
    patient: { name: 'Hadassa Da Silva Santos Garcia', age: 33, sex: 'Feminino', phone: '(11) 97654-3210' },
    eventos: [],
    consultations: [
      { date: '2024-08-05', doctor: 'Dr. C', diagnosis: 'Check-up preventivo', notes: 'Exame clínico sem alterações' },
      { date: '2024-07-22', doctor: 'Dr. A', diagnosis: 'Consulta ginecológica', notes: 'Resultado do papanicolau normal' }
    ],
    exams: [
      { date: '2024-07-25', type: 'Papanicolau', result: 'Normal', doctor: 'Dr. A' },
      { date: '2024-07-15', type: 'Ultrassom pélvico', result: 'Sem alterações', doctor: 'Dr. C' }
    ],
    allergies: ['Lactose'],
    meds: [
      { name: 'Ácido fólico 5mg', frequency: '1x/dia', duration: 'Uso contínuo' },
      { name: 'Ferro quelato 14mg', frequency: '1x/dia após almoço', duration: '6 meses' }
    ]
  },
  '4849323': {
    idPersona: '4849323',
    nomeCompleto: 'William Lopes Do Nascimento',
    cpf: '02876267179',
    idade: 27,
    nascimento: '1997-09-10',
    genero: 'Masculino',
    patient: { name: 'William Lopes Do Nascimento', age: 27, sex: 'Masculino', phone: '(11) 96543-2109' },
    eventos: [],
    consultations: [],
    exams: [],
    allergies: [],
    meds: []
  },
  '5150400': {
    idPersona: '5150400',
    nomeCompleto: 'Erika Carvalho Mendes',
    cpf: '11892727922',
    idade: 38,
    nascimento: '1987-05-04',
    genero: 'Feminino',
    patient: { name: 'Erika Carvalho Mendes', age: 38, sex: 'Feminino', phone: '(11) 95432-1098' },
    eventos: [],
    consultations: [],
    exams: [],
    allergies: [],
    meds: []
  },
  '5155665': {
    idPersona: '5155665',
    nomeCompleto: 'Natalia Da Silva Mello',
    cpf: '09941565708',
    idade: 42,
    nascimento: '1982-12-27',
    genero: 'Feminino',
    patient: { name: 'Natalia Da Silva Mello', age: 42, sex: 'Feminino', phone: '(11) 94321-0987' },
    eventos: [],
    consultations: [],
    exams: [],
    allergies: [],
    meds: []
  }
};

// Helper para parse de JSON do corpo da requisição
function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const parsed = body ? JSON.parse(body) : {};
      callback(null, parsed);
    } catch (e) {
      callback(e, null);
    }
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // === ROTAS DE AUTOSAVE ===
  if (req.method === 'PATCH' && pathname.startsWith('/api/consultations/') && pathname.endsWith('/draft')) {
    const consultationId = pathname.split('/')[3];
    
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }));
        return;
      }
      
      const draftKey = `${consultationId}`;
      drafts.set(draftKey, { ...body, savedAt: new Date().toISOString() });
      
      console.log(`📝 Draft saved for consultation ${consultationId}`);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, savedAt: new Date().toISOString() }));
    });
    return;
  }

  if (req.method === 'POST' && pathname.startsWith('/api/consultations/') && pathname.endsWith('/draft/beacon')) {
    const consultationId = pathname.split('/')[3];
    
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }));
        return;
      }
      
      console.log(`🚨 Beacon draft received for consultation ${consultationId}`);
      
      // Processar fila de drafts
      if (Array.isArray(body)) {
        body.forEach((draft, idx) => {
          const draftKey = `${consultationId}_beacon_${idx}`;
          drafts.set(draftKey, { ...draft, savedAt: new Date().toISOString() });
        });
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, processed: Array.isArray(body) ? body.length : 1 }));
    });
    return;
  }

  // === ROTA PHR ===
  if (req.method === 'GET' && pathname.startsWith('/api/patients/') && pathname.endsWith('/phr')) {
    const patientId = pathname.split('/')[3];
    const limit = parseInt(parsedUrl.searchParams.get('limit')) || 20;
    
    const phrData = mockPHRData[patientId];
    if (!phrData) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Patient not found' }));
      return;
    }
    
    // Simular auditoria
    console.log(`👁️ PHR viewed for patient ${patientId}`);
    
    // Limitar resultados
    const limitedData = {
      ...phrData,
      consultations: phrData.consultations.slice(0, limit),
      exams: phrData.exams.slice(0, limit)
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(limitedData));
    return;
  }

  // === ROTA PHR DIRETA ===
  if (req.method === 'GET' && pathname.startsWith('/api/phr/')) {
    const patientId = pathname.split('/')[3];
    const limit = parseInt(parsedUrl.searchParams.get('limit')) || 20;
    
    const phrData = mockPHRData[patientId];
    if (!phrData) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Patient not found' }));
      return;
    }
    
    // Simular auditoria
    console.log(`👁️ PHR viewed for patient ${patientId}`);
    
    // Limitar resultados
    const limitedData = {
      ...phrData,
      consultations: phrData.consultations.slice(0, limit),
      exams: phrData.exams.slice(0, limit)
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(limitedData));
    return;
  }

  // === ROTA PHR JSON FILES ===
  if (req.method === 'GET' && pathname.startsWith('/data/phr/') && pathname.endsWith('.json')) {
    const patientId = path.basename(pathname, '.json');
    const jsonFilePath = path.join(process.cwd(), '..', '..', 'public', 'data', 'phr', `${patientId}.json`);
    
    fs.readFile(jsonFilePath, (err, content) => {
      if (err) {
        console.log(`❌ PHR JSON not found: ${jsonFilePath}`);
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'PHR not found' }));
        return;
      }
      
      console.log(`📄 PHR JSON served for patient ${patientId}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(content);
    });
    return;
  }

  // === ROTA DE EVENTOS (telemetria) ===
  if (req.method === 'POST' && pathname === '/api/events') {
    parseBody(req, (err, body) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false }));
        return;
      }
      
      console.log(`📊 Event: ${body.type} - ${JSON.stringify(body)}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  // === ROTAS DR. AI ASSISTANT ===
  // Importar handlers (no topo do arquivo será necessário adicionar o require)
  const aiHandlers = require('./routes/ai.js');
  
  // Rota para respostas do assistente (OpenAI + Postgres)
  if (req.method === 'POST' && pathname === '/api/ai/answer') {
    aiHandlers.handleAnswers(req, res);
    return;
  }

  // Rota para auditoria (telemetria do Dr. AI)
  if (req.method === 'POST' && pathname === '/api/ai/audit') {
    aiHandlers.handleAudit(req, res);
    return;
  }

  // Rota para TTS (Text-to-Speech)
  if (req.method === 'POST' && pathname === '/api/ai/tts') {
    aiHandlers.handleTTS(req, res);
    return;
  }

  // Rota para STT (Speech-to-Text)
  if (req.method === 'POST' && pathname === '/api/ai/stt') {
    aiHandlers.handleSTT(req, res);
    return;
  }
  
  // Rota para escalações
  if (req.method === 'POST' && pathname === '/api/ai/escalations') {
    aiHandlers.handleEscalations(req, res);
    return;
  }

  // Prometheus metrics endpoint
  if (req.method === 'GET' && pathname === '/metrics') {
    const metricsHandlers = require('./routes/metrics.js');
    metricsHandlers.handleMetrics(req, res);
    return;
  }

  // Health check endpoint for Render observability
  if (req.url === '/api/health' || req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      ok: true, 
      service: 'telemed-frontend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      drafts_count: drafts.size
    }));
    return;
  }

  // === ROTAS SPA PHR ===
  // Serve phr-react.html para rotas PHR e compatibilidade (EXCETO phr.html)
  const urlPath = req.url.split('?')[0];
  if ((urlPath === '/phr' || urlPath.startsWith('/phr/') || urlPath === '/registro-saude') && urlPath !== '/phr.html') {
    fs.readFile(path.join(process.cwd(), 'phr-react.html'), (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end('PHR SPA not found');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content, 'utf-8');
      }
    });
    return;
  }


  // Sanitize the URL and prevent directory traversal
  let requestPath = req.url === '/' ? '/index.html' : req.url;
  
  // Remove query parameters and fragments
  requestPath = requestPath.split('?')[0].split('#')[0];
  
  // Strip leading slashes and normalize to prevent directory traversal
  const cleanPath = requestPath.replace(/^\/+/, '').replace(/^(\.\.[\/\\])+/, '');
  const normalizedPath = path.normalize(cleanPath);
  
  // Resolve the file path within the current working directory
  const root = process.cwd();
  const filePath = path.resolve(root, normalizedPath);
  
  // Ensure the file is within the current directory using proper path resolution
  if (!filePath.startsWith(path.resolve(root) + path.sep) && filePath !== path.resolve(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp'
  };
  
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Try serving index.html for SPA routing
        fs.readFile(path.join(process.cwd(), 'index.html'), (indexErr, indexContent) => {
          if (indexErr) {
            res.writeHead(404);
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexContent, 'utf-8');
          }
        });
      } else if (err.code === 'EISDIR') {
        // If it's a directory, try to serve index.html from that directory
        const directoryIndex = path.join(filePath, 'index.html');
        fs.readFile(directoryIndex, (dirErr, dirContent) => {
          if (dirErr) {
            // Fall back to SPA routing with root index.html
            fs.readFile(path.join(process.cwd(), 'index.html'), (spaErr, spaContent) => {
              if (spaErr) {
                res.writeHead(404);
                res.end('404 Not Found');
              } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(spaContent, 'utf-8');
              }
            });
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(dirContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => {
  console.log(`Telemed frontend server running on port ${port}`);
});