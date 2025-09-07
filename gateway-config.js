// Configuração de Gateway/Proxy para MDA
// Para ser usado no servidor principal (telemed-docs-automation)

import { createProxyMiddleware } from 'http-proxy-middleware';

const MDA_SERVICE_URL = process.env.MDA_SERVICE_URL || 'http://localhost:8080';

export function setupMDAGateway(app) {
  console.log('[GATEWAY] Configurando proxy MDA para:', MDA_SERVICE_URL);

  // Proxy HTTP para /api/mda/*
  app.use('/api/mda', createProxyMiddleware({
    target: MDA_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/mda': '/api/mda'
    },
    onProxyReq: (proxyReq, req, res) => {
      // Adicionar headers de trace
      proxyReq.setHeader('X-Gateway-Source', 'telemed-main');
      proxyReq.setHeader('X-Request-Id', req.headers['x-request-id'] || Date.now());
    },
    onError: (err, req, res) => {
      console.error('[GATEWAY] Erro no proxy MDA:', err.message);
      res.status(502).json({
        error: 'mda_service_unavailable',
        message: 'Serviço MDA temporariamente indisponível',
        ts: new Date().toISOString()
      });
    }
  }));

  // Proxy WebSocket para /ws-mda
  app.use('/ws-mda', createProxyMiddleware({
    target: MDA_SERVICE_URL,
    ws: true,
    changeOrigin: true,
    pathRewrite: {
      '^/ws-mda': '/ws'
    },
    onError: (err, req, socket, head) => {
      console.error('[GATEWAY] Erro no WebSocket MDA:', err.message);
      socket.write('HTTP/1.1 502 Bad Gateway\\r\\n' +
                   'Connection: close\\r\\n' +
                   '\\r\\n');
      socket.destroy();
    }
  }));

  console.log('[GATEWAY] Rotas MDA configuradas:');
  console.log('  HTTP: /api/mda/* -> ' + MDA_SERVICE_URL + '/api/mda/*');
  console.log('  WebSocket: /ws-mda -> ' + MDA_SERVICE_URL + '/ws');
}

// Feature Flag middleware para TELEMED
export function mdaFeatureFlag(req, res, next) {
  const mdaEnabled = process.env.MDA_ENABLED === 'true';
  
  if (!mdaEnabled && req.path.startsWith('/api/mda')) {
    return res.status(503).json({
      error: 'feature_disabled',
      message: 'Medical Desk Advanced está desabilitado',
      feature: 'mda',
      enabled: false
    });
  }
  
  req.mdaEnabled = mdaEnabled;
  next();
}