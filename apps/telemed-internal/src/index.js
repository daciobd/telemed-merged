// apps/telemed-internal/src/index.js
import express from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(express.json({ limit: "2mb" }));

// Healthcheck
app.get("/healthz", (_req, res) => res.json({ ok: true }));

// Middleware de autenticação interna
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || "";
app.use("/internal", (req, res, next) => {
  const token = req.header("X-Internal-Token");
  if (!INTERNAL_TOKEN || token !== INTERNAL_TOKEN) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
  next();
});

// Cria consulta a partir de um lance aceito (imediato/agendado)
app.post("/internal/appointments/from-bid", async (req, res) => {
  try {
    const {
      bidId,
      patientId,
      physicianId = null,
      isImmediate = true,
      scheduledFor = null,
    } = req.body || {};

    if (!bidId || !patientId) {
      return res
        .status(400)
        .json({ ok: false, error: "bidId e patientId são obrigatórios" });
    }

    const appointment = await prisma.appointment.create({
      data: {
        bidId,
        patientId,
        physicianId,
        origin: "auction",
        status: "scheduled",
        startsAt:
          isImmediate ? null : scheduledFor ? new Date(scheduledFor) : null,
      },
    });

    await prisma.externalEvent.create({
      data: {
        type: "appointment.created.fromBid",
        payload: req.body,
        status: "received",
      },
    });

    return res.status(201).json({ ok: true, data: appointment });
  } catch (err) {
    console.error("[from-bid] error:", err);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 10000;
app.listen(PORT, () => {
  console.log(`telemed-internal on ${PORT}`);
});

// Encerramento gracioso
process.on("SIGTERM", async () => {
  try {
    await prisma.$disconnect();
  } finally {
    process.exit(0);
  }
});
