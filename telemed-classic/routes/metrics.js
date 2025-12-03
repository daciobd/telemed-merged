// routes/metrics.js - Endpoint de métricas Prometheus

import { register } from "../util/metrics.js";

/**
 * Handler para /metrics
 * Retorna métricas no formato Prometheus
 */
export async function handleMetrics(req, res) {
  try {
    const metrics = await register.metrics();
    
    res.writeHead(200, { 
      'Content-Type': register.contentType 
    });
    res.end(metrics);
  } catch (error) {
    console.error('❌ Error getting metrics:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

/**
 * Registra rota de métricas no server
 */
export function registerMetricsRoute(server) {
  // Não registrar como parte do router normal
  // Será tratado diretamente no server.js
}
