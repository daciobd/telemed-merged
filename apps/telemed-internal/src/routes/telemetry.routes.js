const express = require("express");
const router = express.Router();
const { pool } = require("../db");

const lastSeen = new Map();
function shouldDrop(sessionId, eventName, ms = 2000) {
  if (!sessionId) return false;
  const key = `${sessionId}|${eventName}`;
  const now = Date.now();
  const prev = lastSeen.get(key) || 0;
  if (now - prev < ms) return true;
  lastSeen.set(key, now);
  return false;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of lastSeen.entries()) {
    if (now - ts > 60000) lastSeen.delete(key);
  }
}, 30000);

const ALLOWED_EVENTS = new Set([
  "landing_view",
  "offer_created",
  "booking_started",
  "booking_confirmed",
  "consult_started",
  "consult_finished",
  "consult_signed",
]);

router.post("/event", express.json({ limit: "100kb" }), async (req, res) => {
  try {
    const body = req.body || {};
    const eventName = String(body.event || "").trim();
    const sessionId = body.sessionId ? String(body.sessionId).trim() : null;

    if (!ALLOWED_EVENTS.has(eventName)) {
      return res.status(400).json({ error: "Evento inválido" });
    }

    if (shouldDrop(sessionId, eventName, 1500)) {
      return res.json({ ok: true, dropped: true });
    }

    const utm = body.utm || {};
    const properties = body.properties && typeof body.properties === "object" ? body.properties : {};

    const userId = req.user?.id || null;
    const referrer = req.get("referer") || null;
    const userAgent = req.get("user-agent") || null;
    const ip = req.ip || req.headers["x-forwarded-for"]?.split(",")[0] || null;
    const path = body.path ? String(body.path).slice(0, 500) : null;

    const sql = `
      INSERT INTO telemetry_events (
        event_name, session_id, user_id,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        referrer, path, ip, user_agent, properties
      ) VALUES (
        $1,$2,$3,
        $4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13
      )
      RETURNING id, created_at
    `;

    const params = [
      eventName,
      sessionId,
      userId,
      utm.source ? String(utm.source).slice(0, 120) : null,
      utm.medium ? String(utm.medium).slice(0, 120) : null,
      utm.campaign ? String(utm.campaign).slice(0, 200) : null,
      utm.content ? String(utm.content).slice(0, 200) : null,
      utm.term ? String(utm.term).slice(0, 200) : null,
      referrer ? String(referrer).slice(0, 800) : null,
      path,
      ip ? String(ip).slice(0, 80) : null,
      userAgent ? String(userAgent).slice(0, 500) : null,
      properties,
    ];

    const r = await pool.query(sql, params);
    return res.json({ ok: true, id: r.rows[0].id, createdAt: r.rows[0].created_at });
  } catch (err) {
    console.error("[telemetry] event error:", err);
    return res.status(500).json({ error: "Erro ao registrar evento" });
  }
});

async function runMigration() {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS telemetry_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        event_name TEXT NOT NULL,
        session_id TEXT,
        user_id UUID,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        utm_content TEXT,
        utm_term TEXT,
        referrer TEXT,
        path TEXT,
        ip TEXT,
        user_agent TEXT,
        properties JSONB NOT NULL DEFAULT '{}'::jsonb
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_telemetry_created_at
        ON telemetry_events (created_at DESC);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_telemetry_event_name_created_at
        ON telemetry_events (event_name, created_at DESC);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_telemetry_utm_campaign_created_at
        ON telemetry_events (utm_campaign, created_at DESC);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_telemetry_session_created_at
        ON telemetry_events (session_id, created_at DESC);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_telemetry_user_created_at
        ON telemetry_events (user_id, created_at DESC);
    `);

    console.log("✅ Tabela telemetry_events migrada com sucesso");
  } catch (err) {
    console.error("[telemetry] migration error:", err);
  }
}

runMigration();

module.exports = router;
