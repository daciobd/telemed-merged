// apps/productivity-service/src/index.js
import express from "express";
import cors from "cors";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin:
      FRONTEND_ORIGIN === "*"
        ? true
        : [FRONTEND_ORIGIN, "https://telemed-deploy-ready.onrender.com"],
  })
);

app.get("/healthz", (req, res) => res.json({ ok: true }));

// ---------- Handler único para sugestão de CIDs ----------
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

// Rotas aceitas (antiga e nova)
app.post("/suggest/cids", suggestCidsHandler);
app.post("/codes/suggest", suggestCidsHandler);  // <— alias solicitado

// fallback 404 em JSON
app.all("*", (req, res) =>
  res.status(404).json({ ok: false, error: "not_found", path: `${req.method} ${req.path}` })
);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("productivity-service on", PORT));