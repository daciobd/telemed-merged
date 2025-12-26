import express from "express";
import {
  processRetargetQueue,
  getRetargetStats,
  getPendingRetargets,
  markRetargetSent,
  markRetargetSkipped,
} from "../services/retargetService.js";

const router = express.Router();

router.post("/run", async (req, res) => {
  const token = req.headers["x-internal-token"];
  if (!process.env.INTERNAL_TOKEN || token !== process.env.INTERNAL_TOKEN) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    const result = await processRetargetQueue();
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("[retarget] run error:", err);
    res.status(500).json({ error: "Erro ao processar retarget" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const stats = await getRetargetStats();
    res.json(stats);
  } catch (err) {
    console.error("[retarget] stats error:", err);
    res.status(500).json({ error: "Erro ao buscar stats" });
  }
});

router.get("/pending", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const pending = await getPendingRetargets(limit);
    res.json({ count: pending.length, items: pending });
  } catch (err) {
    console.error("[retarget] pending error:", err);
    res.status(500).json({ error: "Erro ao buscar pendentes" });
  }
});

router.post("/:id/send", async (req, res) => {
  const token = req.headers["x-internal-token"];
  if (!process.env.INTERNAL_TOKEN || token !== process.env.INTERNAL_TOKEN) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    const { id } = req.params;
    const { channel, reason } = req.body || {};

    await markRetargetSent(id, reason || `sent via ${channel || "manual"}`);
    res.json({ ok: true });
  } catch (err) {
    console.error("[retarget] send error:", err);
    res.status(500).json({ error: "Erro ao marcar como enviado" });
  }
});

router.post("/:id/skip", async (req, res) => {
  const token = req.headers["x-internal-token"];
  if (!process.env.INTERNAL_TOKEN || token !== process.env.INTERNAL_TOKEN) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    await markRetargetSkipped(id, reason || "skipped manually");
    res.json({ ok: true });
  } catch (err) {
    console.error("[retarget] skip error:", err);
    res.status(500).json({ error: "Erro ao marcar como pulado" });
  }
});

export default router;
