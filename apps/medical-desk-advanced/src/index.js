import express from "express";
import cors from "cors";
import initializeFeatureFlags from "./features/featureFlags.js";
import { initMetrics } from "./monitoring/metrics.js";
import mdaRouter from "./routes/mda.js";

const app = express();
app.use(express.json());

// Patch 6: CORS configurado para BID funcionar
app.use(cors({ 
  origin: ['https://telemed-deploy-ready.onrender.com'],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Internal-Token"]
}));

initMetrics();
initializeFeatureFlags(); // inicializa sem travar mesmo sem flags

// Padronizado: /api/health (alias para /api/mda/health)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: process.env.SERVICE_NAME || 'medical-desk-advanced',
    time: new Date().toISOString()
  });
});

app.use("/api/mda", mdaRouter);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 Starting Medical Desk Advanced Service...`);
  console.log(`[${process.env.SERVICE_NAME || 'medical-desk-advanced'}] listening on :${port}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: port,
    CORS_ORIGINS: 'all origins allowed',
    SERVICE_NAME: process.env.SERVICE_NAME || 'medical-desk-advanced'
  });
});
