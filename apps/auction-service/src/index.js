// apps/auction-service/src/index.js
import express from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(express.json({ limit: "2mb" }));

// Healthcheck
app.get("/healthz", (_req, res) => res.json({ ok: true }));

const INTERNAL_URL = process.env.INTERNAL_URL_TELEMED || "";
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || "";

// Aceita um lance e cria consulta via serviço internal
// POST /bids/:id/accept  body: { mode: 'immediate'|'scheduled', patientId, physicianId?, scheduledFor? }
app.post("/bids/:id/accept", async (req, res) => {
  try {
    const id = req.params.id;
    const {
      mode = "immediate",
      patientId,
      physicianId = null,
      scheduledFor = null,
    } = req.body || {};

    if (!INTERNAL_URL || !INTERNAL_TOKEN) {
      return res
        .status(500)
        .json({ ok: false, error: "internal_service_not_configured" });
    }
    if (!patientId) {
      return res
        .status(400)
        .json({ ok: false, error: "patientId é obrigatório" });
    }

    // Atualiza o lance como aceito
    await prisma.bid.update({
      where: { id },
      data: {
        status:
          mode === "immediate" ? "accepted_immediate" : "accepted_scheduled",
        acceptedAt: new Date(),
        scheduledFor:
          mode === "scheduled" && scheduledFor ? new Date(scheduledFor) : null,
      },
    });

    // Chama o internal para criar a consulta
    const resp = await fetch(
      new URL("/internal/appointments/from-bid", INTERNAL_URL),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": INTERNAL_TOKEN,
        },
        body: JSON.stringify({
          bidId: id,
          patientId,
          physicianId,
          isImmediate: mode === "immediate",
          scheduledFor,
        }),
      }
    );

    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return res
        .status(502)
        .json({ ok: false, error: "internal_failed", details: payload });
    }

    return res.status(200).json({ ok: true, appointment: payload.data });
  } catch (err) {
    console.error("[accept bid] error:", err);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 10000;
app.listen(PORT, () => {
  console.log(`auction-service on ${PORT}`);
});

process.on("SIGTERM", async () => {
  try {
    await prisma.$disconnect();
  } finally {
    process.exit(0);
  }
});
