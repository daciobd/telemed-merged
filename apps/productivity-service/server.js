import express from "express";
import cors from "cors";
import path from 'path';

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ['https://telemed-deploy-ready.onrender.com'],
    credentials: true
  })
);

// Health check endpoint
app.get("/healthz", (req, res) => res.json({ ok: true }));

// Padronized health endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: process.env.SERVICE_NAME || 'telemed-productivity',
    time: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'telemed-productivity',
    status: 'running',
    endpoints: ['/healthz', '/api/health', '/suggest/cids', '/codes/suggest']
  });
});

// Single handler for CID suggestions
function suggestCidsHandler(req, res) {
  const { text = "" } = req.body || {};
  const t = text.toLowerCase();
  const items = [];

  if (t.includes("dor torácica") || /dor.*tor(a|á)x/i.test(t)) {
    items.push({ system: "CID10", code: "R07.4", label: "Dor torácica", confidence: 0.78 });
  }
  if (t.includes("dispneia")) {
    items.push({ system: "CID10", code: "R06.0", label: "Dispneia", confidence: 0.72 });
  }
  if (t.includes("sudorese")) {
    items.push({ system: "CID10", code: "R61", label: "Hiperidrose (sudorese)", confidence: 0.55 });
  }
  if (!items.length) {
    items.push({ system: "CID10", code: "Z00.0", label: "Exame médico geral", confidence: 0.30 });
  }

  res.json({ ok: true, items });
}

// Accepted routes (old and new)
app.post("/suggest/cids", suggestCidsHandler);
app.post("/codes/suggest", suggestCidsHandler);

// 404 fallback in JSON
app.all("*", (req, res) =>
  res.status(404).json({ ok: false, error: "not_found", path: `${req.method} ${req.path}` })
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Starting TeleMed Productivity Service...`);
  console.log(`[${process.env.SERVICE_NAME || 'telemed-productivity'}] listening on :${PORT}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: PORT,
    CORS_ORIGINS: 'telemed-deploy-ready.onrender.com',
    FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'NOT SET'
  });
});