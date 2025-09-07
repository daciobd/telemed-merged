// Servidor principal do Medical Desk Advanced
import express from "express";
import cors from "cors";
import http from "http";
import { mda } from "./routes/mda.js";
import { createWSServer } from "./ws/index.js";
import { 
  metricsMiddleware, 
  getMetricsEndpoint, 
  getMetricsJSON, 
  initializeMetrics 
} from "./monitoring/metrics.js";
import { 
  requestLogger, 
  secureErrorHandler, 
  rateLimit 
} from "./middleware/security.js";
import { 
  featureFlagsMiddleware,
  getFeatureFlagsAdmin,
  updateFeatureFlagAdmin,
  getUserFeatures,
  initializeFeatureFlags
} from "./features/featureFlags.js";
import { getDashboard, getPublicDashboard } from "./dashboard/dashboard.js";

const app = express();

// Inicializar sistemas
initializeMetrics();
initializeFeatureFlags();

// Middlewares de segurança e observabilidade
app.use(requestLogger);
app.use(metricsMiddleware);
app.use(rateLimit(100, 60000)); // 100 req/min por IP

// Middlewares básicos
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || true,
  credentials: false
}));
app.use(express.json({ limit: '2mb' }));

// Feature flags middleware
app.use(featureFlagsMiddleware);

// Endpoints de observabilidade (públicos)
app.get('/metrics', getMetricsEndpoint);
app.get('/api/mda/metrics/json', getMetricsJSON);
app.get('/dashboard', getPublicDashboard);

// Endpoints admin (protegidos)
app.get('/admin/dashboard', getDashboard);
app.get('/api/mda/admin/feature-flags', getFeatureFlagsAdmin);
app.patch('/api/mda/admin/feature-flags/:featureName', updateFeatureFlagAdmin);

// Endpoint público de features do usuário
app.get('/api/mda/user/features', getUserFeatures);

// Montar router MDA com namespace
app.use('/api/mda', mda);

// Middleware de tratamento de erros
app.use(secureErrorHandler);

// Rota raiz com informações completas
app.get('/', (req, res) => {
  res.json({
    service: 'Medical Desk Advanced',
    version: '1.0.0',
    status: 'running',
    features: req.features || {},
    endpoints: {
      // Públicos
      'GET /api/mda/health': 'Health check',
      'GET /api/mda/config': 'Configuração de features',
      'GET /metrics': 'Métricas Prometheus',
      'GET /dashboard': 'Dashboard público',
      
      // Protegidos (JWT)
      'POST /api/mda/ai/analyze-symptoms': 'Análise de sintomas por IA',
      'POST /api/mda/ai/intelligent-prescription': 'Prescrição inteligente', 
      'POST /api/mda/telemedicine/sessions': 'Criar sessão de telemedicina',
      'GET /api/mda/consultations': 'Listar consultas',
      'GET /api/mda/user/features': 'Features do usuário',
      
      // Admin
      'GET /admin/dashboard': 'Dashboard admin',
      'GET /api/mda/admin/feature-flags': 'Gerenciar feature flags',
      
      // WebSocket
      'WebSocket /ws': 'Tempo real (gateway: /ws-mda)'
    },
    production_gates: {
      'smoke_tests': '✅ Implementado',
      'openapi_contracts': '✅ Implementado', 
      'security_jwt': '✅ Implementado',
      'pii_masking': '✅ Implementado',
      's3_signed_urls': '✅ Implementado',
      'observability': '✅ Implementado',
      'feature_flags': '✅ Implementado',
      'load_tests': '✅ Implementado',
      'backup_restore': '✅ Implementado'
    },
    ts: new Date().toISOString()
  });
});

// Criar servidor HTTP + WebSocket
const server = http.createServer(app);
const wss = createWSServer(server);

// Adicionar referência do WSS ao servidor para broadcast
server._wss = wss;

const PORT = process.env.PORT || 8080;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[MDA] Medical Desk Advanced rodando na porta ${PORT}`);
  console.log('Endpoints disponíveis:');
  console.log(`  HTTP: http://localhost:${PORT}/api/mda/health`);
  console.log(`  WebSocket: ws://localhost:${PORT}/ws`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_AUTH: !!process.env.JWT_PUBLIC_KEY_PEM,
    DATABASE: !!process.env.DATABASE_URL
  });
});