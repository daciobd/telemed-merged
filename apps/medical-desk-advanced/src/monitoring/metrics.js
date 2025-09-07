// Sistema de métricas e observabilidade para MDA
import { secureLog } from '../middleware/security.js';

// Armazenamento de métricas em memória (substituir por Redis/InfluxDB em produção)
const metrics = {
  requests: {
    total: 0,
    success: 0,
    errors: 0,
    by_endpoint: {},
    by_status_code: {}
  },
  latency: {
    samples: [],
    p50: 0,
    p95: 0,
    p99: 0,
    avg: 0
  },
  websockets: {
    active_connections: 0,
    total_connections: 0,
    messages_sent: 0,
    messages_received: 0
  },
  ai_analysis: {
    total_analyses: 0,
    avg_confidence: 0,
    triage_distribution: { baixa: 0, media: 0, alta: 0 }
  },
  telemedicine: {
    active_sessions: 0,
    total_sessions: 0,
    avg_session_duration: 0
  },
  system: {
    uptime: 0,
    memory_usage: 0,
    cpu_usage: 0
  }
};

// Middleware para coleta de métricas
export function metricsMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Incrementar contador de requests
  metrics.requests.total++;
  
  // Contar por endpoint
  const endpoint = `${req.method} ${req.route?.path || req.path}`;
  metrics.requests.by_endpoint[endpoint] = (metrics.requests.by_endpoint[endpoint] || 0) + 1;
  
  // Override do res.end para capturar métricas de resposta
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    // Registrar latência
    addLatencySample(duration);
    
    // Contar por status code
    const statusCode = res.statusCode;
    metrics.requests.by_status_code[statusCode] = (metrics.requests.by_status_code[statusCode] || 0) + 1;
    
    // Classificar sucesso/erro
    if (statusCode >= 200 && statusCode < 400) {
      metrics.requests.success++;
    } else {
      metrics.requests.errors++;
    }
    
    // Log de métrica (somente em debug)
    if (process.env.DEBUG_METRICS === 'true') {
      secureLog('debug', 'Request metrics', {
        endpoint,
        statusCode,
        duration: `${duration}ms`,
        requestId: req.requestId
      });
    }
    
    return originalEnd.apply(this, args);
  };
  
  next();
}

// Adicionar amostra de latência
function addLatencySample(duration) {
  metrics.latency.samples.push(duration);
  
  // Manter apenas as últimas 1000 amostras
  if (metrics.latency.samples.length > 1000) {
    metrics.latency.samples = metrics.latency.samples.slice(-1000);
  }
  
  // Recalcular percentis
  calculateLatencyPercentiles();
}

// Calcular percentis de latência
function calculateLatencyPercentiles() {
  const samples = [...metrics.latency.samples].sort((a, b) => a - b);
  const length = samples.length;
  
  if (length === 0) return;
  
  metrics.latency.p50 = samples[Math.floor(length * 0.5)];
  metrics.latency.p95 = samples[Math.floor(length * 0.95)];
  metrics.latency.p99 = samples[Math.floor(length * 0.99)];
  metrics.latency.avg = samples.reduce((a, b) => a + b, 0) / length;
}

// Registrar evento de IA
export function recordAIAnalysis(triage, confidence) {
  metrics.ai_analysis.total_analyses++;
  metrics.ai_analysis.triage_distribution[triage] = (metrics.ai_analysis.triage_distribution[triage] || 0) + 1;
  
  // Calcular média de confiança
  const currentAvg = metrics.ai_analysis.avg_confidence;
  const total = metrics.ai_analysis.total_analyses;
  metrics.ai_analysis.avg_confidence = ((currentAvg * (total - 1)) + confidence) / total;
}

// Registrar evento de WebSocket
export function recordWebSocketEvent(event, data = {}) {
  switch (event) {
    case 'connection':
      metrics.websockets.active_connections++;
      metrics.websockets.total_connections++;
      break;
    case 'disconnection':
      metrics.websockets.active_connections--;
      break;
    case 'message_sent':
      metrics.websockets.messages_sent++;
      break;
    case 'message_received':
      metrics.websockets.messages_received++;
      break;
  }
}

// Registrar evento de telemedicina
export function recordTelemedicineEvent(event, data = {}) {
  switch (event) {
    case 'session_start':
      metrics.telemedicine.active_sessions++;
      metrics.telemedicine.total_sessions++;
      break;
    case 'session_end':
      metrics.telemedicine.active_sessions--;
      if (data.duration) {
        const currentAvg = metrics.telemedicine.avg_session_duration;
        const total = metrics.telemedicine.total_sessions;
        metrics.telemedicine.avg_session_duration = ((currentAvg * (total - 1)) + data.duration) / total;
      }
      break;
  }
}

// Atualizar métricas do sistema
function updateSystemMetrics() {
  metrics.system.uptime = process.uptime();
  
  const memUsage = process.memoryUsage();
  metrics.system.memory_usage = {
    rss: memUsage.rss,
    heapTotal: memUsage.heapTotal,
    heapUsed: memUsage.heapUsed,
    external: memUsage.external
  };
  
  // CPU usage seria obtido de biblioteca externa em produção
  metrics.system.cpu_usage = 0; // Mock
}

// Endpoint de métricas (Prometheus format)
export function getMetricsEndpoint(req, res) {
  updateSystemMetrics();
  
  // Calcular taxas de erro
  const errorRate = metrics.requests.total > 0 ? 
    (metrics.requests.errors / metrics.requests.total) * 100 : 0;
  
  const successRate = 100 - errorRate;
  
  // Formato Prometheus-like
  const prometheusMetrics = `
# HELP mda_requests_total Total number of requests
# TYPE mda_requests_total counter
mda_requests_total ${metrics.requests.total}

# HELP mda_requests_success_total Total number of successful requests
# TYPE mda_requests_success_total counter
mda_requests_success_total ${metrics.requests.success}

# HELP mda_requests_errors_total Total number of failed requests
# TYPE mda_requests_errors_total counter
mda_requests_errors_total ${metrics.requests.errors}

# HELP mda_request_duration_ms Request duration in milliseconds
# TYPE mda_request_duration_ms histogram
mda_request_duration_ms{quantile="0.5"} ${metrics.latency.p50}
mda_request_duration_ms{quantile="0.95"} ${metrics.latency.p95}
mda_request_duration_ms{quantile="0.99"} ${metrics.latency.p99}
mda_request_duration_ms_avg ${metrics.latency.avg}

# HELP mda_websocket_connections Active WebSocket connections
# TYPE mda_websocket_connections gauge
mda_websocket_connections ${metrics.websockets.active_connections}

# HELP mda_ai_analyses_total Total number of AI analyses performed
# TYPE mda_ai_analyses_total counter
mda_ai_analyses_total ${metrics.ai_analysis.total_analyses}

# HELP mda_ai_confidence_avg Average confidence of AI analyses
# TYPE mda_ai_confidence_avg gauge
mda_ai_confidence_avg ${metrics.ai_analysis.avg_confidence}

# HELP mda_telemedicine_sessions Active telemedicine sessions
# TYPE mda_telemedicine_sessions gauge
mda_telemedicine_sessions ${metrics.telemedicine.active_sessions}

# HELP mda_system_uptime_seconds System uptime in seconds
# TYPE mda_system_uptime_seconds gauge
mda_system_uptime_seconds ${metrics.system.uptime}
`.trim();

  res.set('Content-Type', 'text/plain');
  res.send(prometheusMetrics);
}

// Endpoint de métricas JSON (para dashboards customizados)
export function getMetricsJSON(req, res) {
  updateSystemMetrics();
  
  const errorRate = metrics.requests.total > 0 ? 
    (metrics.requests.errors / metrics.requests.total) * 100 : 0;
  
  const healthStatus = {
    healthy: errorRate < 1 && metrics.latency.p95 < 400,
    error_rate: errorRate,
    avg_latency: metrics.latency.avg,
    p95_latency: metrics.latency.p95
  };
  
  res.json({
    timestamp: new Date().toISOString(),
    service: 'medical-desk-advanced',
    health: healthStatus,
    metrics,
    alerts: generateAlerts()
  });
}

// Gerar alertas baseados nas métricas
function generateAlerts() {
  const alerts = [];
  
  // Alert: Taxa de erro > 1%
  const errorRate = metrics.requests.total > 0 ? 
    (metrics.requests.errors / metrics.requests.total) * 100 : 0;
  
  if (errorRate > 1) {
    alerts.push({
      severity: 'warning',
      type: 'high_error_rate',
      message: `Taxa de erro alta: ${errorRate.toFixed(2)}%`,
      threshold: '1%',
      current: `${errorRate.toFixed(2)}%`
    });
  }
  
  // Alert: p95 > 400ms
  if (metrics.latency.p95 > 400) {
    alerts.push({
      severity: 'warning',
      type: 'high_latency',
      message: `Latência p95 alta: ${metrics.latency.p95}ms`,
      threshold: '400ms',
      current: `${metrics.latency.p95}ms`
    });
  }
  
  // Alert: Muitas conexões WebSocket
  if (metrics.websockets.active_connections > 1000) {
    alerts.push({
      severity: 'info',
      type: 'high_websocket_usage',
      message: `Muitas conexões WebSocket ativas: ${metrics.websockets.active_connections}`,
      threshold: '1000',
      current: `${metrics.websockets.active_connections}`
    });
  }
  
  return alerts;
}

// Inicializar sistema de métricas
export function initializeMetrics() {
  // Atualizar métricas do sistema a cada 30 segundos
  setInterval(updateSystemMetrics, 30000);
  
  // Log de métricas a cada 5 minutos
  setInterval(() => {
    secureLog('info', 'Metrics summary', {
      total_requests: metrics.requests.total,
      error_rate: metrics.requests.total > 0 ? 
        ((metrics.requests.errors / metrics.requests.total) * 100).toFixed(2) + '%' : '0%',
      avg_latency: metrics.latency.avg + 'ms',
      p95_latency: metrics.latency.p95 + 'ms',
      active_websockets: metrics.websockets.active_connections,
      active_sessions: metrics.telemedicine.active_sessions,
      uptime: Math.floor(metrics.system.uptime) + 's'
    });
  }, 5 * 60 * 1000);
  
  secureLog('info', 'Metrics system initialized');
}