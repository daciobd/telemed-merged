// Servidor principal do Medical Desk Advanced
import express from "express";
import cors from "cors";
import http from "http";
import { mda } from "./routes/mda.js";
import { createWSServer } from "./ws/index.js";

const app = express();

// Middlewares básicos
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || true,
  credentials: false
}));
app.use(express.json({ limit: '2mb' }));

// Logging básico
app.use((req, res, next) => {
  console.log(`[MDA] ${req.method} ${req.url}`);
  next();
});

// Montar router MDA com namespace
app.use('/api/mda', mda);

// Rota raiz simples
app.get('/', (req, res) => {
  res.json({
    service: 'Medical Desk Advanced',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      'GET /api/mda/health': 'Health check (público)',
      'POST /api/mda/ai/analyze-symptoms': 'Análise de sintomas por IA',
      'POST /api/mda/ai/intelligent-prescription': 'Prescrição inteligente',
      'POST /api/mda/telemedicine/sessions': 'Criar sessão de telemedicina',
      'GET /api/mda/consultations': 'Listar consultas',
      'WebSocket /ws': 'Tempo real (via gateway: /ws-mda)'
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