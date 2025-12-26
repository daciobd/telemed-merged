import express from "express";
import { pool } from "../db/pool.js";

const router = express.Router();

async function ensureAdsSpendTable() {
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
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(provider, account_id, campaign_id, adset_id, ad_id, date)
    );
    CREATE INDEX IF NOT EXISTS idx_ads_spend_daily_date ON ads_spend_daily(date);
    CREATE INDEX IF NOT EXISTS idx_ads_spend_daily_provider ON ads_spend_daily(provider);
    CREATE INDEX IF NOT EXISTS idx_ads_spend_daily_campaign ON ads_spend_daily(campaign_name);
  `;
  await pool.query(sql);
}

ensureAdsSpendTable().catch(err => console.error("[cac] Failed to create ads_spend_daily:", err.message));

router.post("/ads/spend", async (req, res) => {
  const { provider, account_id, campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name, spend, currency, date } = req.body;

  if (!provider || !account_id || spend == null || !date) {
    return res.status(400).json({ error: "provider, account_id, spend, date são obrigatórios" });
  }

  const sql = `
    INSERT INTO ads_spend_daily 
      (provider, account_id, campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name, spend, currency, date)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (provider, account_id, campaign_id, adset_id, ad_id, date)
    DO UPDATE SET
      campaign_name = EXCLUDED.campaign_name,
      adset_name = EXCLUDED.adset_name,
      ad_name = EXCLUDED.ad_name,
      spend = EXCLUDED.spend,
      currency = EXCLUDED.currency
    RETURNING *
  `;

  try {
    const result = await pool.query(sql, [
      provider,
      account_id,
      campaign_id || null,
      campaign_name || null,
      adset_id || null,
      adset_name || null,
      ad_id || null,
      ad_name || null,
      parseFloat(spend),
      currency || "BRL",
      date
    ]);
    res.json({ ok: true, row: result.rows[0] });
  } catch (err) {
    console.error("[cac] spend insert error:", err);
    res.status(500).json({ error: "Erro ao inserir gasto" });
  }
});

router.post("/ads/spend/bulk", async (req, res) => {
  const rows = req.body.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: "rows deve ser array não-vazio" });
  }

  const inserted = [];
  const errors = [];

  for (const r of rows) {
    if (!r.provider || !r.account_id || r.spend == null || !r.date) {
      errors.push({ row: r, error: "Campos obrigatórios faltando" });
      continue;
    }

    const sql = `
      INSERT INTO ads_spend_daily 
        (provider, account_id, campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name, spend, currency, date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (provider, account_id, campaign_id, adset_id, ad_id, date)
      DO UPDATE SET
        campaign_name = EXCLUDED.campaign_name,
        adset_name = EXCLUDED.adset_name,
        ad_name = EXCLUDED.ad_name,
        spend = EXCLUDED.spend,
        currency = EXCLUDED.currency
      RETURNING id
    `;

    try {
      const result = await pool.query(sql, [
        r.provider,
        r.account_id,
        r.campaign_id || null,
        r.campaign_name || null,
        r.adset_id || null,
        r.adset_name || null,
        r.ad_id || null,
        r.ad_name || null,
        parseFloat(r.spend),
        r.currency || "BRL",
        r.date
      ]);
      inserted.push(result.rows[0].id);
    } catch (err) {
      errors.push({ row: r, error: err.message });
    }
  }

  res.json({ ok: true, inserted: inserted.length, errors });
});

router.get("/cac-real", async (req, res) => {
  const from = req.query.from || null;
  const to = req.query.to || null;
  const groupBy = req.query.groupBy || "campaign";

  const spendGroupExpr = groupBy === "adset" ? "adset_name" : groupBy === "ad" ? "ad_name" : "campaign_name";

  const spendSql = `
    SELECT
      provider,
      coalesce(${spendGroupExpr}, '(sem nome)') AS grp,
      SUM(spend) AS spend
    FROM ads_spend_daily
    WHERE
      date >= coalesce($1::date, (now() - interval '30 days')::date)
      AND date <= coalesce($2::date, now()::date)
    GROUP BY provider, grp
    ORDER BY spend DESC
  `;

  const conversionSql = `
    SELECT
      coalesce(utm_campaign, '(sem campanha)') AS grp,
      COUNT(*) AS consultas_assinadas,
      COALESCE(SUM((properties->>'platformFee')::numeric), 0) AS receita_plataforma
    FROM telemetry_events
    WHERE
      event_name = 'consult_signed'
      AND created_at >= coalesce($1::date, (now() - interval '30 days')::date)
      AND created_at < (coalesce($2::date, now()::date) + interval '1 day')
    GROUP BY grp
  `;

  try {
    const [spendRes, convRes] = await Promise.all([
      pool.query(spendSql, [from, to]),
      pool.query(conversionSql, [from, to])
    ]);

    const convMap = new Map();
    for (const r of convRes.rows) {
      convMap.set(r.grp, {
        consultas_assinadas: parseInt(r.consultas_assinadas),
        receita_plataforma: parseFloat(r.receita_plataforma)
      });
    }

    const rows = spendRes.rows.map(r => {
      const conv = convMap.get(r.grp) || { consultas_assinadas: 0, receita_plataforma: 0 };
      const spend = parseFloat(r.spend);
      const cac = conv.consultas_assinadas > 0 ? spend / conv.consultas_assinadas : null;
      const cacPercent = conv.receita_plataforma > 0 ? spend / conv.receita_plataforma : null;

      return {
        provider: r.provider,
        campaign: r.grp,
        spend,
        consultasAssinadas: conv.consultas_assinadas,
        receitaPlataforma: conv.receita_plataforma,
        cac: cac ? parseFloat(cac.toFixed(2)) : null,
        cacPercentual: cacPercent ? parseFloat(cacPercent.toFixed(4)) : null
      };
    });

    const totalSpend = rows.reduce((acc, r) => acc + r.spend, 0);
    const totalConsultas = rows.reduce((acc, r) => acc + r.consultasAssinadas, 0);
    const totalReceita = rows.reduce((acc, r) => acc + r.receitaPlataforma, 0);
    const avgCac = totalConsultas > 0 ? totalSpend / totalConsultas : null;
    const avgCacPercent = totalReceita > 0 ? totalSpend / totalReceita : null;

    res.json({
      range: { from, to },
      groupBy,
      summary: {
        totalSpend,
        totalConsultas,
        totalReceita,
        avgCac: avgCac ? parseFloat(avgCac.toFixed(2)) : null,
        avgCacPercent: avgCacPercent ? parseFloat(avgCacPercent.toFixed(4)) : null
      },
      rows
    });
  } catch (err) {
    console.error("[cac-real] error:", err);
    res.status(500).json({ error: "Erro ao calcular CAC" });
  }
});

router.get("/ads/spend", async (req, res) => {
  const from = req.query.from || null;
  const to = req.query.to || null;

  const sql = `
    SELECT * FROM ads_spend_daily
    WHERE
      date >= coalesce($1::date, (now() - interval '30 days')::date)
      AND date <= coalesce($2::date, now()::date)
    ORDER BY date DESC, provider, campaign_name
    LIMIT 500
  `;

  try {
    const result = await pool.query(sql, [from, to]);
    res.json({ ok: true, rows: result.rows });
  } catch (err) {
    console.error("[cac] spend list error:", err);
    res.status(500).json({ error: "Erro ao listar gastos" });
  }
});

export default router;
