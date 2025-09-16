import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { securityHeaders, apiSecurityHeaders, rateLimitHeaders } from './security-headers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS
app.use(cors({
  origin: [
    'https://telemed-deploy-ready.onrender.com',
    'https://telemed-internal.onrender.com',
    'http://localhost:5000',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.static('public'));

// Aplicar headers de segurança
app.use(securityHeaders);
app.use('/api/*', apiSecurityHeaders);
app.use(rateLimitHeaders(100, 900000)); // 100 requests per 15 min

// Dados dos serviços TeleMed
const SERVICES = {
  'telemed-internal': 'https://telemed-internal.onrender.com',
  'telemed-auction': 'https://telemed-auction.onrender.com', 
  'telemed-productivity': 'https://telemed-productivity.onrender.com',
  'medical-desk-advanced': 'https://medical-desk-advanced.onrender.com',
  'telemed-docs-automation': 'https://telemed-docs-automation.onrender.com'
};

// ===== HEALTH ENDPOINTS =====

// Health check básico
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'telemed-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Status agregado de todos os serviços
app.get('/status.json', async (_req, res) => {
  const startTime = Date.now();
  const serviceStatuses = {};
  
  try {
    // Verificar status de cada serviço em paralelo
    const healthChecks = Object.entries(SERVICES).map(async ([serviceName, serviceUrl]) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch(`${serviceUrl}/api/health`, {
          signal: controller.signal,
          headers: { 'User-Agent': 'TeleMed-Gateway/1.0' }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          return [serviceName, {
            status: 'healthy',
            response_time_ms: Date.now() - startTime,
            last_check: new Date().toISOString(),
            url: serviceUrl
          }];
        } else {
          return [serviceName, {
            status: 'unhealthy',
            response_time_ms: Date.now() - startTime,
            last_check: new Date().toISOString(),
            url: serviceUrl,
            error: `HTTP ${response.status}`
          }];
        }
      } catch (error) {
        return [serviceName, {
          status: 'unhealthy',
          response_time_ms: Date.now() - startTime,
          last_check: new Date().toISOString(),
          url: serviceUrl,
          error: error.message
        }];
      }
    });
    
    const results = await Promise.all(healthChecks);
    results.forEach(([serviceName, status]) => {
      serviceStatuses[serviceName] = status;
    });
    
    // Determinar status geral
    const healthyServices = Object.values(serviceStatuses).filter(s => s.status === 'healthy').length;
    const totalServices = Object.keys(serviceStatuses).length;
    const healthPercentage = (healthyServices / totalServices) * 100;
    
    let overallStatus = 'healthy';
    if (healthPercentage < 50) {
      overallStatus = 'unhealthy';
    } else if (healthPercentage < 80) {
      overallStatus = 'degraded';
    }
    
    const statusResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      gateway: {
        name: 'telemed-gateway',
        version: '1.0.0',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'production'
      },
      summary: {
        total_services: totalServices,
        healthy_services: healthyServices,
        health_percentage: Math.round(healthPercentage),
        total_response_time_ms: Date.now() - startTime
      },
      services: serviceStatuses
    };
    
    // Status HTTP baseado na saúde geral
    const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 206 : 503;
    res.status(httpStatus).json(statusResponse);
    
  } catch (error) {
    console.error('Gateway status check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      gateway: {
        name: 'telemed-gateway',
        version: '1.0.0'
      },
      error: 'Gateway internal error'
    });
  }
});

// ===== PÁGINAS CRÍTICAS =====

// Servir páginas estáticas críticas
const CRITICAL_PAGES = [
  'status.html',
  'admin-flags.html', 
  'termos-privacidade.html',
  'dashboard-piloto.html'
];

CRITICAL_PAGES.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    try {
      // Proxy para telemed-deploy-ready
      res.redirect(301, `https://telemed-deploy-ready.onrender.com/${page}`);
    } catch (error) {
      res.status(503).send(`
        <h1>Serviço Temporariamente Indisponível</h1>
        <p>A página ${page} não pode ser carregada no momento.</p>
        <p>Tente novamente em alguns instantes ou entre em contato com o suporte.</p>
        <hr>
        <small>TeleMed Gateway - ${new Date().toISOString()}</small>
      `);
    }
  });
});

// Endpoint raiz com informações do gateway
app.get('/', (_req, res) => {
  res.json({
    name: 'TeleMed Gateway',
    version: '1.0.0',
    description: 'Unified entry point for TeleMed pilot infrastructure',
    endpoints: {
      health: '/health',
      status: '/status.json',
      pages: CRITICAL_PAGES
    },
    services: Object.keys(SERVICES),
    timestamp: new Date().toISOString()
  });
});

// ===== PROXY ENDPOINTS =====

// ===== PROXY ENDPOINTS COM AUTENTICAÇÃO =====

// Proxy de logs para telemed-internal  
app.post('/api/logs', async (req, res) => {
  try {
    const response = await fetch('https://telemed-internal.onrender.com/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': process.env.INTERNAL_TOKEN || 'change-me-internal'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: 'Gateway proxy error',
      details: error.message
    });
  }
});

// Proxy de eventos para telemed-internal
app.post('/api/events', async (req, res) => {
  try {
    const response = await fetch('https://telemed-internal.onrender.com/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': process.env.INTERNAL_TOKEN || 'change-me-internal'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: 'Gateway events proxy error',
      details: error.message
    });
  }
});

// Proxy de métricas WebRTC para telemed-internal
app.post('/api/webrtc-metrics', async (req, res) => {
  try {
    const response = await fetch('https://telemed-internal.onrender.com/api/webrtc-metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': process.env.INTERNAL_TOKEN || 'change-me-internal'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: 'Gateway WebRTC metrics proxy error',
      details: error.message
    });
  }
});

// Proxy de métricas do sistema (público)
app.get('/api/metrics', async (req, res) => {
  try {
    const queryString = new URLSearchParams(req.query).toString();
    const url = `https://telemed-internal.onrender.com/api/metrics${queryString ? '?' + queryString : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Internal-Token': process.env.INTERNAL_TOKEN || 'change-me-internal'
      }
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: 'Gateway metrics proxy error',
      details: error.message
    });
  }
});

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`🚀 TeleMed Gateway running on port ${PORT}`);
  console.log(`📊 Monitoring ${Object.keys(SERVICES).length} services`);
  console.log(`🔗 Status endpoint: http://localhost:${PORT}/status.json`);
  console.log(`🏥 Critical pages: ${CRITICAL_PAGES.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Gateway shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Gateway interrupted, shutting down');
  process.exit(0);
});