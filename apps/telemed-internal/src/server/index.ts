import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Importar rotas
import authRoutes from './routes/auth.routes';
import doctorRoutes from './routes/doctor.routes';
import consultationRoutes from './routes/consultation.routes';
import virtualOfficeRoutes from './routes/virtual-office.routes';
import bidRoutes from './routes/bid.routes';
import patientRoutes from './routes/patient.routes';
import internalRouter from './routes/internal';

// Importar middlewares
import { errorHandler } from './middleware/error.middleware';
import { notFound } from './middleware/not-found.middleware';

// Carregar variáveis de ambiente
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES GLOBAIS
// ============================================

// Segurança
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'TeleMed API - Consultório Virtual',
    version: '1.0.0',
    docs: '/api/docs'
  });
});
app.get("/__routes", (req, res) => {
  // @ts-ignore
  const routes = app._router?.stack
    ?.filter((l: any) => l.route)
    .map((l: any) => ({
      method: Object.keys(l.route.methods)[0]?.toUpperCase(),
      path: l.route.path,
    })) || [];

  res.json({ count: routes.length, routes });
});

// ============================================
// ROTAS DA API
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/dr', virtualOfficeRoutes); // Página pública: /api/dr/:customUrl
app.use('/api/consultations', consultationRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/internal', internalRouter);
app.use('/api/patients', patientRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 - Not Found
app.use(notFound);

// Error Handler
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 TeleMed API rodando na porta ${PORT}`);
  console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

export default app;

// Rotas internas (admin/monitoring)

// Rotas internas (admin/monitoring)
