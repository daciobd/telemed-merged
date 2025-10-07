const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URLSearchParams } = require('url');

const server = http.createServer((req, res) => {
  // Health check endpoint for Render observability
  if (req.url === '/api/health' || req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      ok: true, 
      service: 'telemed-frontend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
    return;
  }

  // Auth API endpoints
  if (req.url.startsWith('/api/auth/')) {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      
      if (req.url === '/api/auth/login' && req.method === 'POST') {
        try {
          const { id, password, role } = JSON.parse(body);
          if (!id || !password || !role) {
            res.writeHead(400);
            res.end(JSON.stringify({ ok: false, error: 'missing_fields' }));
            return;
          }
          const user = { id, role, name: role === 'medico' ? 'Dr(a). Teste' : 'Paciente Teste' };
          const token = Buffer.from(JSON.stringify({ sub: id, role, exp: Date.now() + 24*60*60*1000 })).toString('base64');
          res.writeHead(200);
          res.end(JSON.stringify({ ok: true, token, user }));
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ ok: false, error: 'invalid_json' }));
        }
        return;
      }
      
      if (req.url === '/api/auth/logout' && req.method === 'POST') {
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true }));
        return;
      }
      
      if (req.url === '/api/auth/me' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, user: null }));
        return;
      }
      
      res.writeHead(404);
      res.end(JSON.stringify({ ok: false, error: 'not_found' }));
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