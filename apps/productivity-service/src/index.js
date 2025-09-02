import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(express.json({ limit: "2mb" }));

const ORIGINS = (process.env.FRONTEND_ORIGIN || "")
  .split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: ORIGINS.length ? ORIGINS : true,
  methods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Internal-Token"]
}));

app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
const pickSuggestion = (x = {}) => ({
  system: isNonEmptyString(x.system) ? String(x.system) : undefined,
  code: isNonEmptyString(x.code) ? String(x.code) : undefined,
  label: isNonEmptyString(x.label) ? String(x.label) : undefined,
  confidence:
    typeof x.confidence === "number"
      ? x.confidence
      : x.confidence !== undefined
      ? Number(x.confidence)
      : undefined,
});

app.post("/code-suggestions", async (req, res) => {
  try {
    const { consultId, items } = req.body || {};
    if (!isNonEmptyString(consultId)) return res.status(400).json({ ok:false, error:"consultId obrigatório" });
    if (!Array.isArray(items)) return res.status(400).json({ ok:false, error:"items deve ser um array" });

    const normalized = items.map(pickSuggestion).filter(s => isNonEmptyString(s.system) && isNonEmptyString(s.code));
    if (normalized.length === 0) return res.status(400).json({ ok:false, error:"Nenhum item válido (system e code)." });

    const tx = normalized.map(s => prisma.codeSuggestion.create({ data: { consultId, ...s } }));
    const created = await prisma.$transaction(tx);

    return res.status(201).json({ ok:true, count: created.length, data: created });
  } catch (err) {
    console.error("[POST /code-suggestions] error:", err);
    return res.status(500).json({ ok:false, error:"internal_error" });
  }
});

app.get("/code-suggestions/:consultId", async (req, res) => {
  try {
    const { consultId } = req.params;
    if (!isNonEmptyString(consultId)) return res.status(400).json({ ok:false, error:"consultId inválido" });

    const rows = await prisma.codeSuggestion.findMany({ where: { consultId }, orderBy: { createdAt: "desc" } });
    return res.json({ ok:true, data: rows });
  } catch (err) {
    console.error("[GET /code-suggestions/:consultId] error:", err);
    return res.status(500).json({ ok:false, error:"internal_error" });
  }
});

app.post("/transcripts", async (req, res) => {
  try {
    const { summaries } = req.body || {};
    const t = await prisma.transcript.create({ data: {} });

    let createdSummaries = [];
    if (Array.isArray(summaries) && summaries.length > 0) {
      const toInsert = summaries.map(s => ({
        transcriptId: t.id,
        type: isNonEmptyString(s.type) ? s.type : null,
        content: isNonEmptyString(s.content) ? s.content : null,
        model: isNonEmptyString(s.model) ? s.model : null,
        tokens:
          typeof s.tokens === "number"
            ? s.tokens
            : s.tokens !== undefined
            ? Number(s.tokens)
            : null,
      }));

      const tx = toInsert.map(row => prisma.aISummary.create({ data: row }));
      createdSummaries = await prisma.$transaction(tx);
    }

    return res.status(201).json({ ok:true, transcriptId: t.id, summaries: createdSummaries });
  } catch (err) {
    console.error("[POST /transcripts] error:", err);
    return res.status(500).json({ ok:false, error:"internal_error" });
  }
});

app.get("/transcripts/:id/summaries", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isNonEmptyString(id)) return res.status(400).json({ ok:false, error:"id inválido" });

    const rows = await prisma.aISummary.findMany({ where: { transcriptId: id }, orderBy: { createdAt: "desc" } });
    return res.json({ ok:true, data: rows });
  } catch (err) {
    console.error("[GET /transcripts/:id/summaries] error:", err);
    return res.status(500).json({ ok:false, error:"internal_error" });
  }
});

app.use((_req, res) => res.status(404).json({ ok:false, error:"not_found" }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 10000;
app.listen(PORT, () => console.log(`productivity-service on ${PORT}`));

process.on("SIGTERM", async () => { try { await prisma.$disconnect(); } finally { process.exit(0); }});
