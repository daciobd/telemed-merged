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

app.get("/healthz", (_req, res) => res.json({ ok: true }));

const INTERNAL_URL = process.env.INTERNAL_URL_TELEMED || "";
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || "";

app.post("/bids/:id/accept", async (req, res) => {
  try {
    const id = req.params.id;
    const { mode = "immediate", patientId, physicianId = null, scheduledFor = null } = req.body || {};
    if (!INTERNAL_URL || !INTERNAL_TOKEN) return res.status(500).json({ ok:false, error:"internal_service_not_configured" });
    if (!patientId) return res.status(400).json({ ok:false, error:"patientId é obrigatório" });

    await prisma.bid.update({
      where: { id },
      data: {
        status: mode === "immediate" ? "accepted_immediate" : "accepted_scheduled",
        acceptedAt: new Date(),
        scheduledFor: mode === "scheduled" && scheduledFor ? new Date(scheduledFor) : null,
      },
    });

    const resp = await fetch(new URL("/internal/appointments/from-bid", INTERNAL_URL), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Internal-Token": INTERNAL_TOKEN },
      body: JSON.stringify({ bidId: id, patientId, physicianId, isImmediate: mode === "immediate", scheduledFor }),
    });

    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) return res.status(502).json({ ok:false, error:"internal_failed", details: payload });
    return res.status(200).json({ ok:true, appointment: payload.data });
  } catch (err) {
    console.error("[accept bid] error:", err);
    return res.status(500).json({ ok:false, error:"internal_error" });
  }
});

app.post("/__dev/create-bid", async (req, res) => {
  try {
    const { patientId="paciente-demo", specialty="clinica_geral", isImmediate=true, amountCents=9000 } = req.body || {};
    const bid = await prisma.bid.create({ data: { patientId, specialty, isImmediate, amountCents, status: "pending" } });
    res.status(201).json({ ok:true, bid });
  } catch (err) {
    console.error("[__dev/create-bid] error:", err);
    res.status(500).json({ ok:false, error:"internal_error" });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 10000;
app.listen(PORT, () => console.log(`auction-service on ${PORT}`));

process.on("SIGTERM", async () => { try { await prisma.$disconnect(); } finally { process.exit(0); }});
