import express from 'express';
import cors from 'cors';
import bidsRouter from './routes/bids.js';

const app = express();

const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';

app.use(express.json());

// CORS configurado para aceitar origens múltiplas
app.use(cors({
  origin: true, // Aceita qualquer origem (simplifificado para demo)
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Internal-Token"]
}));

// Health checks (público)
app.get('/healthz', (_req,res)=>res.json({ok:true, service: 'auction-service'}));
app.get('/health', (_req,res)=>res.json({ok:true, service: 'auction-service'}));

// Root endpoint
app.get('/', (_req,res)=>res.json({
  service: 'telemed-auction',
  status: 'running',
  endpoints: [
    '/healthz', 
    '/health', 
    '/api/health',
    '/api/bids (POST)',
    '/api/bids/:id (GET)',
    '/api/bids/:id/search (POST)',
    '/api/bids/:id/increase (PUT)',
    '/api/bids/:id/accept (POST)'
  ],
  version: '2.0.0-mock'
}));

// Prefixo /api para as rotas de mock
app.use('/api', bidsRouter);

app.listen(PORT, () => {
  console.log(`🚀 TeleMed Auction Service (Mock Mode)`);
  console.log(`[${process.env.SERVICE_NAME || 'telemed-auction'}] listening on :${PORT}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: PORT,
    CORS: 'all origins allowed',
    JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'using default (dev-only)',
    MODE: 'IN-MEMORY MOCK (no database required)'
  });
  console.log('✅ Mock endpoints ready at /api/*');
});
