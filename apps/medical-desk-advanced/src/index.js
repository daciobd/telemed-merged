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

// Servir arquivos estáticos da pasta public (medical-desk-standalone.html)
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Servir build do React (dashboard MedicalDesk)
const clientBuild = path.join(__dirname, '..', 'client', 'dist');
app.use('/medicaldesk', express.static(clientBuild));

// Rota raiz: página standalone
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
        criteria: "PA ≥ 140/90 mmHg em pelo menos 2 consultas, MAPA ou MRPA confirmando valores elevados",
        exams: ["ECG", "Ecocardiograma", "Creatinina", "Potássio", "Glicemia", "Perfil lipídico"]
      },
      treatment: {
        lifestyle: ["Redução de sódio (<2g/dia)", "Dieta DASH", "Exercícios (150min/semana)", "Perda de peso"],
        medications: [
          { class: "IECA", examples: ["Enalapril 5-40mg/dia", "Captopril 25-150mg/dia"], line: "1ª linha" },
          { class: "BRA", examples: ["Losartana 50-100mg/dia"], line: "1ª linha" }
        ]
      },
      followup: {
        frequency: "A cada 3-6 meses",
        monitoring: ["PA", "Creatinina", "Potássio"]
      }
    },
    diabetes: {
      name: "Diabetes Mellitus Tipo 2",
      description: "Doença metabólica crônica caracterizada por hiperglicemia.",
      diagnosis: {
        criteria: "Glicemia jejum ≥126mg/dL (2x) ou HbA1c ≥6.5%",
        exams: ["Glicemia jejum", "HbA1c", "Perfil lipídico", "Creatinina"]
      },
      treatment: {
        lifestyle: ["Dieta hipocalórica", "Exercícios (150min/semana)", "Perda de peso 5-10%"],
        medications: [
          { class: "Biguanidas", examples: ["Metformina 500-2000mg/dia"], line: "1ª linha" },
          { class: "iSGLT2", examples: ["Dapagliflozina 10mg/dia"], line: "2ª linha" }
        ]
      },
      followup: {
        frequency: "A cada 3 meses",
        monitoring: ["HbA1c", "Glicemia", "Peso", "PA"]
      }
    },
    iam: {
      name: "Infarto Agudo do Miocárdio",
      description: "Síndrome coronariana aguda com necrose miocárdica.",
      diagnosis: {
        criteria: "Dor torácica + troponina elevada + ECG alterado",
        exams: ["ECG 12 derivações", "Troponina", "CK-MB", "Ecocardiograma"]
      },
      treatment: {
        lifestyle: ["Repouso 24-48h", "Cessação tabagismo", "Reabilitação cardíaca"],
        medications: [
          { class: "Antiagregantes", examples: ["AAS 100mg/dia", "Clopidogrel 75mg/dia"], line: "1ª linha" },
          { class: "Betabloqueadores", examples: ["Metoprolol 25-100mg"], line: "1ª linha" }
        ]
      },
      followup: {
        frequency: "7-14 dias pós-alta",
        monitoring: ["ECG", "Ecocardiograma", "Troponina"]
      }
    },
    asma: {
      name: "Asma Brônquica",
      description: "Doença inflamatória crônica das vias aéreas.",
      diagnosis: {
        criteria: "Sintomas variáveis + espirometria reversível",
        exams: ["Espirometria", "Pico de fluxo", "Raio-X tórax"]
      },
      treatment: {
        lifestyle: ["Evitar alérgenos", "Controle ambiental", "Vacinação influenza"],
        medications: [
          { class: "Corticoide inalatório", examples: ["Budesonida 200-800mcg/dia"], line: "1ª linha" },
          { class: "Beta-2 resgate", examples: ["Salbutamol 100-200mcg"], line: "Resgate" }
        ]
      },
      followup: {
        frequency: "1-3 meses até controle",
        monitoring: ["Sintomas", "Pico de fluxo", "Espirometria anual"]
      }
    },
    pneumonia: {
      name: "Pneumonia Comunitária",
      description: "Infecção aguda do parênquima pulmonar.",
      diagnosis: {
        criteria: "Sintomas respiratórios + infiltrado no RX tórax",
        exams: ["RX tórax", "Hemograma", "PCR", "Gasometria"]
      },
      treatment: {
        lifestyle: ["Repouso", "Hidratação 2-3L/dia"],
        medications: [
          { class: "Amoxicilina+Clav", examples: ["875/125mg 12/12h 5-7d"], line: "1ª linha" },
          { class: "Macrolídeos", examples: ["Azitromicina 500mg/dia 3-5d"], line: "Associação" }
        ]
      },
      followup: {
        frequency: "48-72h ambulatorial, RX 4-6sem",
        monitoring: ["Temperatura", "SatO2", "RX controle"]
      }
    }
  };
  
  const condition = req.params.condition.toLowerCase().trim();
  const protocol = protocolsDatabase[condition];
  
  if (!protocol) {
    return res.status(404).json({ 
      error: "Protocolo não encontrado",
      message: `Condições disponíveis: ${Object.keys(protocolsDatabase).join(', ')}`,
      available: Object.keys(protocolsDatabase),
      source: "medical-desk-advanced"
    });
  }
  
  console.log(`[PROTOCOLS] Servindo protocolo: ${condition}`);
  res.json({ success: true, protocol, source: "medical-desk-advanced", timestamp: new Date().toISOString() });
});

// Fallback: rotas não-API servem o React app (SPA routing)
app.get('/medicaldesk/*', (req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'));
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
  console.log('Routes:', {
    '/': 'Standalone HTML interface',
    '/medicaldesk/': 'React Dashboard (SPA)',
    '/api/health': 'Health check',
    '/api/protocols/:condition': 'Clinical protocols API',
    '/api/mda/*': 'MDA routes'
  });
});
