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