import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import initializeFeatureFlags from "./features/featureFlags.js";
import { initMetrics } from "./monitoring/metrics.js";
import mdaRouter from "./routes/mda.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Patch 6: CORS configurado para BID funcionar + protocolos
app.use(cors({ 
  origin: ['https://telemed-deploy-ready.onrender.com', 'http://localhost:5000'],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Internal-Token"]
}));

initMetrics();
initializeFeatureFlags();

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'medical-desk-standalone.html'));
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: process.env.SERVICE_NAME || 'medical-desk-advanced',
    time: new Date().toISOString()
  });
});

app.use("/api/mda", mdaRouter);

app.get('/api/protocols/:condition', (req, res) => {
  const protocolsDatabase = {
    hipertensao: {
      name: "Hipertensão Arterial Sistêmica",
      description: "Doença cardiovascular crônica caracterizada por níveis elevados de pressão arterial (≥140/90 mmHg).",
      diagnosis: {
        criteria: "PA ≥ 140/90 mmHg em pelo menos 2 consultas",
        exams: ["ECG", "Ecocardiograma", "Creatinina", "Potássio", "Glicemia", "Perfil lipídico"]
      },
      treatment: {
        lifestyle: ["Redução de sódio (<2g/dia)", "Dieta DASH", "Exercícios (150min/semana)", "Perda de peso"],
        medications: [
          { class: "IECA", examples: ["Enalapril 5-40mg/dia", "Captopril 25-150mg/dia"], line: "1ª linha" },
          { class: "BRA", examples: ["Losartana 50-100mg/dia", "Valsartana 80-320mg/dia"], line: "1ª linha" }
        ]
      },
      followup: {
        frequency: "A cada 3-6 meses",
        monitoring: ["PA", "Creatinina", "Potássio"]
      }
    }
  };
  
  const condition = req.params.condition.toLowerCase();
  const protocol = protocolsDatabase[condition];
  
  if (!protocol) {
    return res.status(404).json({ error: "Protocolo não encontrado" });
  }
  
  res.json({ success: true, protocol });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 Starting Medical Desk Advanced Service...`);
  console.log(`[${process.env.SERVICE_NAME || 'medical-desk-advanced'}] listening on :${port}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: port,
    CORS_ORIGINS: 'localhost + telemed-deploy-ready allowed',
    SERVICE_NAME: process.env.SERVICE_NAME || 'medical-desk-advanced'
  });
});
