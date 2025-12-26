import express from "express";

const router = express.Router();

// Pool é importado de forma lazy para não bloquear o import
let pool = null;

async function getPool() {
  if (!pool) {
    const mod = await import('../db/pool.js');
    pool = mod.pool;
  }
  return pool;
}

async function ensureAdsSpendTable(p) {
  const sql = `
    CREATE TABLE IF NOT EXISTS ads_spend_daily (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      provider TEXT NOT NULL,
      account_id TEXT NOT NULL,
      campaign_id TEXT,
      campaign_name TEXT,
      adset_id TEXT,
      adset_name TEXT,
      ad_id TEXT,
      ad_name TEXT,
      spend NUMERIC(12,2) NOT NULL,
      currency TEXT DEFAULT 'BRL',
      date DATE NOT NULL,
      notes TEXT,
      created_by TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(provider, account_id, campaign_id, adset_id, ad_id, date)
    );
    CREATE INDEX IF NOT EXISTS idx_ads_spend_daily_date ON ads_spend_daily(date);
    CREATE INDEX IF NOT EXISTS idx_ads_spend_daily_provider ON ads_spend_daily(provider);
    CREATE INDEX IF NOT EXISTS idx_ads_spend_daily_campaign ON ads_spend_daily(campaign_name);
  `;
  await p.query(sql);
}

// GET - listar gastos
router.get("/", async (req, res) => {
  try {
    const p = await getPool();
    await ensureAdsSpendTable(p);
    
    const from = req.query.from || null;
    const to = req.query.to || null;
    const channel = req.query.channel || null;

    const sql = `
      SELECT 
        id,
        date,
        provider as channel,
        campaign_name,
        spend as amount,
        currency,
        notes,
        created_by,
        created_at,
        updated_at
      FROM ads_spend_daily
      WHERE
        date >= coalesce($1::date, (now() - interval '30 days')::date)
        AND date <= coalesce($2::date, now()::date)
        ${channel ? `AND provider = $3` : ""}
      ORDER BY date DESC, provider, campaign_name
      LIMIT 500
    `;

    const params = channel ? [from, to, channel] : [from, to];
    const result = await p.query(sql, params);
    res.json({ ok: true, spends: result.rows });
  } catch (err) {
    console.error("[marketing-spend] GET error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST - adicionar gasto
router.post("/", async (req, res) => {
  try {
    const p = await getPool();
    await ensureAdsSpendTable(p);
    
    const { date, channel, campaign_name, amount, notes } = req.body;
    
    if (!date || !channel || amount == null) {
      return res.status(400).json({ ok: false, error: "date, channel e amount são obrigatórios" });
    }

    const sql = `
      INSERT INTO ads_spend_daily (date, provider, account_id, campaign_name, spend, notes, created_by)
      VALUES ($1, $2, 'manual', $3, $4, $5, 'manager')
      RETURNING id, date, provider as channel, campaign_name, spend as amount, notes
    `;

    const result = await p.query(sql, [date, channel, campaign_name || '', amount, notes || '']);
    res.json({ ok: true, spend: result.rows[0] });
  } catch (err) {
    console.error("[marketing-spend] POST error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE - remover gasto
router.delete("/:id", async (req, res) => {
  try {
    const p = await getPool();
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ ok: false, error: "id é obrigatório" });
    }

    await p.query("DELETE FROM ads_spend_daily WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("[marketing-spend] DELETE error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
