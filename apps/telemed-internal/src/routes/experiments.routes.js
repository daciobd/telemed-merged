import express from "express";
import { pool } from "../db/pool.js";

const router = express.Router();

async function ensureExperimentsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS experiments (
      id TEXT PRIMARY KEY,
      is_active BOOLEAN NOT NULL DEFAULT true,
      traffic_percent INT NOT NULL DEFAULT 100,
      variants JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_experiments_active ON experiments(is_active);
  `;
  await pool.query(sql);
}

ensureExperimentsTable().catch(err => console.error("[experiments] Failed to create table:", err.message));

router.get("/active", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, traffic_percent, variants
      FROM experiments
      WHERE is_active = true
    `);

    res.json({
      experiments: result.rows.map(r => ({
        id: r.id,
        trafficPercent: r.traffic_percent,
        variants: r.variants
      }))
    });
  } catch (err) {
    console.error("[experiments] active list error:", err);
    res.status(500).json({ error: "Erro ao listar experimentos" });
  }
});

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM experiments ORDER BY created_at DESC
    `);
    res.json({ ok: true, experiments: result.rows });
  } catch (err) {
    console.error("[experiments] list error:", err);
    res.status(500).json({ error: "Erro ao listar experimentos" });
  }
});

router.post("/", async (req, res) => {
  const { id, traffic_percent, variants, is_active } = req.body;

  if (!id || !variants || !Array.isArray(variants)) {
    return res.status(400).json({ error: "id e variants (array) são obrigatórios" });
  }

  const sql = `
    INSERT INTO experiments (id, traffic_percent, variants, is_active)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (id)
    DO UPDATE SET
      traffic_percent = EXCLUDED.traffic_percent,
      variants = EXCLUDED.variants,
      is_active = EXCLUDED.is_active,
      updated_at = now()
    RETURNING *
  `;

  try {
    const result = await pool.query(sql, [
      id,
      traffic_percent ?? 100,
      JSON.stringify(variants),
      is_active ?? true
    ]);
    res.json({ ok: true, experiment: result.rows[0] });
  } catch (err) {
    console.error("[experiments] upsert error:", err);
    res.status(500).json({ error: "Erro ao criar experimento" });
  }
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { is_active, traffic_percent, variants } = req.body;

  const updates = [];
  const values = [];
  let idx = 1;

  if (is_active !== undefined) {
    updates.push(`is_active = $${idx++}`);
    values.push(is_active);
  }
  if (traffic_percent !== undefined) {
    updates.push(`traffic_percent = $${idx++}`);
    values.push(traffic_percent);
  }
  if (variants !== undefined) {
    updates.push(`variants = $${idx++}`);
    values.push(JSON.stringify(variants));
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "Nada para atualizar" });
  }

  updates.push(`updated_at = now()`);
  values.push(id);

  const sql = `UPDATE experiments SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`;

  try {
    const result = await pool.query(sql, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Experimento não encontrado" });
    }
    res.json({ ok: true, experiment: result.rows[0] });
  } catch (err) {
    console.error("[experiments] update error:", err);
    res.status(500).json({ error: "Erro ao atualizar experimento" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM experiments WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Experimento não encontrado" });
    }
    res.json({ ok: true, deleted: id });
  } catch (err) {
    console.error("[experiments] delete error:", err);
    res.status(500).json({ error: "Erro ao deletar experimento" });
  }
});

router.get("/ab", async (req, res) => {
  const experiment = req.query.experiment;
  const from = req.query.from || null;
  const to = req.query.to || null;

  if (!experiment) {
    return res.status(400).json({ error: "experiment é obrigatório" });
  }

  const sql = `
    WITH events AS (
      SELECT
        session_id,
        event_name,
        properties,
        (properties->'experiments'->>'${experiment}') AS variant
      FROM telemetry_events
      WHERE
        created_at >= coalesce($1::date, (now() - interval '30 days')::date)
        AND created_at < (coalesce($2::date, now()::date) + interval '1 day')
        AND properties->'experiments' ? '${experiment}'
    ),
    by_variant AS (
      SELECT
        variant,
        COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'landing_view') AS landing_sessions,
        COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'booking_confirmed') AS booking_sessions,
        COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'consult_signed') AS signed_sessions,
        COALESCE(SUM((properties->>'agreedPrice')::numeric) FILTER (WHERE event_name = 'booking_confirmed'), 0) AS gmv,
        COALESCE(SUM((properties->>'platformFee')::numeric) FILTER (WHERE event_name = 'booking_confirmed'), 0) AS platform_fee
      FROM events
      GROUP BY variant
    )
    SELECT * FROM by_variant ORDER BY variant
  `;

  try {
    const result = await pool.query(sql, [from, to]);

    const rows = result.rows.map(r => {
      const landing = parseInt(r.landing_sessions) || 0;
      const booking = parseInt(r.booking_sessions) || 0;
      const signed = parseInt(r.signed_sessions) || 0;
      const gmv = parseFloat(r.gmv) || 0;
      const fee = parseFloat(r.platform_fee) || 0;

      return {
        variant: r.variant,
        landingSessions: landing,
        bookingSessions: booking,
        signedSessions: signed,
        cvr: landing > 0 ? ((booking / landing) * 100).toFixed(2) : "0.00",
        gmv,
        platformFee: fee,
        gmvPerSession: landing > 0 ? parseFloat((gmv / landing).toFixed(2)) : 0,
        feePerSession: landing > 0 ? parseFloat((fee / landing).toFixed(2)) : 0
      };
    });

    res.json({
      experiment,
      range: { from, to },
      variants: rows
    });
  } catch (err) {
    console.error("[experiments] ab analysis error:", err);
    res.status(500).json({ error: "Erro ao analisar experimento" });
  }
});

export default router;
