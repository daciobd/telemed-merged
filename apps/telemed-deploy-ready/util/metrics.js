// util/metrics.js - Observabilidade com Prometheus

import client from "prom-client";

// Registry global
export const register = new client.Registry();

// Coletar métricas padrão do Node.js (CPU, memória, etc)
client.collectDefaultMetrics({ register });

// Métricas customizadas para Dr. AI

/**
 * Latência das chamadas à IA em millisegundos
 * Buckets otimizados para latências de API de IA
 */
export const aiLatency = new client.Histogram({
  name: "ai_latency_ms",
  help: "Latency of AI call in milliseconds",
  buckets: [100, 300, 600, 1000, 2000, 4000, 8000, 16000],
  labelNames: ["model", "attempt", "fallback"]
});

/**
 * Contador de tentativas de chamadas à IA
 */
export const aiAttempts = new client.Counter({
  name: "ai_attempts_total",
  help: "Number of AI attempts",
  labelNames: ["model", "fallback", "success"]
});

/**
 * Contador de uso de modelo fallback
 */
export const aiFallbackUsed = new client.Counter({
  name: "ai_fallback_used_total",
  help: "Times fallback model was used"
});

/**
 * Contador de bloqueios por rate limiting
 */
export const rateLimitBlocks = new client.Counter({
  name: "rate_limit_blocks_total",
  help: "Rate limit blocks",
  labelNames: ["key_type"] // "patient" | "ip"
});

/**
 * Contador de respostas JSON inválidas da IA
 */
export const schemaInvalid = new client.Counter({
  name: "schema_invalid_total",
  help: "Invalid JSON schema returned by AI"
});

/**
 * Contador de escalações por tipo
 */
export const escalations = new client.Counter({
  name: "escalations_total",
  help: "Escalations triggered by guardrails",
  labelNames: ["tipo"] // "escala_emergencia" | "fora_escopo"
});

/**
 * Contador de validações de segurança
 */
export const safetyValidations = new client.Counter({
  name: "safety_validations_total",
  help: "Safety validations triggered",
  labelNames: ["type", "triggered"] // type: emergency|new_symptom|out_of_scope, triggered: true|false
});

/**
 * Contador de deny-list hits (pós-parsing)
 */
export const denyListHits = new client.Counter({
  name: "deny_list_hits_total",
  help: "Deny-list validations that blocked AI responses"
});

/**
 * Tempo de resposta das rotas HTTP
 */
export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in milliseconds",
  buckets: [50, 100, 200, 500, 1000, 2000, 5000],
  labelNames: ["method", "route", "status_code"]
});

// Registrar todas as métricas
register.registerMetric(aiLatency);
register.registerMetric(aiAttempts);
register.registerMetric(aiFallbackUsed);
register.registerMetric(rateLimitBlocks);
register.registerMetric(schemaInvalid);
register.registerMetric(escalations);
register.registerMetric(safetyValidations);
register.registerMetric(denyListHits);
register.registerMetric(httpRequestDuration);

/**
 * Middleware para medir tempo de resposta HTTP
 */
export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.url.split('?')[0]; // Remove query params
    
    httpRequestDuration.observe({
      method: req.method,
      route,
      status_code: res.statusCode
    }, duration);
  });
  
  next();
}
