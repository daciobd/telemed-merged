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

// CAC Real - gasto manual por canal/campanha + conversões globais (prontuarios_consulta.signed_at)
// NOTA: CAC por campanha "de verdade" requer UTMs no booking para agregar signed/platformFee por utm_campaign.
// Atualmente mostra: gastos por grupo + totais globais de conversão (CAC global distribuído por linha de gasto).
router.get("/cac-real", async (req, res) => {
  const from = req.query.from;
  const to = req.query.to;
  const groupBy = req.query.groupBy || "channel_campaign";

  if (!from || !to) {
    return res.status(400).json({ error: "Parâmetros obrigatórios: from, to (YYYY-MM-DD)" });
  }

  try {
    // 1) Totais de conversão/receita (assinadas via prontuarios_consulta + platformFee via consultations)
    const convSql = `
      SELECT
        COUNT(*) AS signed,
        COALESCE(SUM(c.platform_fee), 0) AS platform_fee
      FROM prontuarios_consulta p
      JOIN consultations c ON c.id::text = p.consulta_id
      WHERE p.signed_at IS NOT NULL
        AND p.signed_at::date >= $1::date
        AND p.signed_at::date <= $2::date
    `;
    const convRes = await pool.query(convSql, [from, to]);
    const signedTotal = parseInt(convRes.rows[0]?.signed || 0);
    const platformFeeTotal = parseFloat(convRes.rows[0]?.platform_fee || 0);

    // 2) Gastos manuais agregados (ads_spend_daily)
    const spendSql = `
      SELECT
        provider AS channel,
        COALESCE(campaign_name, '') AS campaign_name,
        COALESCE(SUM(spend), 0) AS spend
      FROM ads_spend_daily
      WHERE date >= $1::date AND date <= $2::date
      GROUP BY provider, COALESCE(campaign_name, '')
      ORDER BY spend DESC
    `;
    const spendRes = await pool.query(spendSql, [from, to]);
    const spendRows = spendRes.rows.map(r => ({
      channel: r.channel,
      campaignName: r.campaign_name || "",
      spend: parseFloat(r.spend || 0)
    }));

    // 3) Reagrupar conforme groupBy
    const keyOf = (r) => {
      if (groupBy === "channel") return `channel:${r.channel}`;
      if (groupBy === "campaign") return `campaign:${r.campaignName || ""}`;
      return `channel_campaign:${r.channel}::${r.campaignName || ""}`;
    };

    const buckets = new Map();
    for (const r of spendRows) {
      const key = keyOf(r);
      const existing = buckets.get(key) || {
        channel: groupBy === "campaign" ? null : r.channel,
        campaignName: groupBy === "channel" ? null : (r.campaignName || ""),
        spend: 0,
      };
      existing.spend += r.spend;
      buckets.set(key, existing);
    }

    const rows = Array.from(buckets.values())
      .sort((a, b) => b.spend - a.spend)
      .map(b => {
        const cac = signedTotal > 0 ? b.spend / signedTotal : null;
        const cacPercent = platformFeeTotal > 0 ? b.spend / platformFeeTotal : null;

        return {
          channel: b.channel,
          campaignName: b.campaignName,
          spend: parseFloat(b.spend.toFixed(2)),
          signed: signedTotal,
          platformFee: parseFloat(platformFeeTotal.toFixed(2)),
          cac: cac == null ? null : parseFloat(cac.toFixed(2)),
          cacPercent: cacPercent == null ? null : parseFloat(cacPercent.toFixed(4)),
        };
      });

    // Totais
    const spendTotal = spendRows.reduce((acc, r) => acc + r.spend, 0);
    const totalCAC = signedTotal > 0 ? spendTotal / signedTotal : null;
    const totalCACPercent = platformFeeTotal > 0 ? spendTotal / platformFeeTotal : null;

    res.json({
      range: { from, to, groupBy },
      rows,
      totals: {
        spend: parseFloat(spendTotal.toFixed(2)),
        signed: signedTotal,
        platformFee: parseFloat(platformFeeTotal.toFixed(2)),
        cac: totalCAC == null ? null : parseFloat(totalCAC.toFixed(2)),
        cacPercent: totalCACPercent == null ? null : parseFloat(totalCACPercent.toFixed(4)),
      },
    });
  } catch (err) {
    console.error("[cac-real] error:", err);
    res.status(500).json({ error: "Erro ao calcular CAC" });
  }
});

// CAC Real Detalhado - endpoint para tela /manager/cac com filtros + tabela + CSV
router.get("/cac-real/details", async (req, res) => {
  const from = req.query.from;
  const to = req.query.to;
  const channel = req.query.channel || "all";
  const onlySigned = req.query.onlySigned === "1";
  const groupBy = req.query.groupBy || "day"; // "day" | "week"

  if (!from || !to) {
    return res.status(400).json({ error: "Parâmetros obrigatórios: from, to (YYYY-MM-DD)" });
  }

  try {
    // 1) Gastos diários da tabela ads_spend_daily (agrupados por data + canal)
    let spendSql = `
      SELECT
        ${groupBy === "week" ? "date_trunc('week', date)::date" : "date"} AS period_date,
        provider AS channel,
        COALESCE(campaign_name, '') AS description,
        COALESCE(SUM(spend), 0) AS spend
      FROM ads_spend_daily
      WHERE date >= $1::date AND date <= $2::date
        ${channel !== "all" ? `AND provider = $3` : ""}
      GROUP BY ${groupBy === "week" ? "date_trunc('week', date)::date" : "date"}, provider, COALESCE(campaign_name, '')
      ORDER BY period_date DESC, provider, spend DESC
    `;
    const spendParams = channel !== "all" ? [from, to, channel] : [from, to];
    const spendRes = await pool.query(spendSql, spendParams);

    // 2) Assinaturas por dia (prontuarios_consulta.signed_at)
    let signupsSql = `
      SELECT
        ${groupBy === "week" ? "date_trunc('week', signed_at::date)::date" : "signed_at::date"} AS period_date,
        COUNT(*) AS signups
      FROM prontuarios_consulta
      WHERE signed_at IS NOT NULL
        AND signed_at::date >= $1::date
        AND signed_at::date <= $2::date
      GROUP BY ${groupBy === "week" ? "date_trunc('week', signed_at::date)::date" : "signed_at::date"}
    `;
    const signupsRes = await pool.query(signupsSql, [from, to]);
    const signupsMap = new Map();
    for (const r of signupsRes.rows) {
      const dateKey = r.period_date instanceof Date 
        ? r.period_date.toISOString().slice(0, 10) 
        : String(r.period_date).slice(0, 10);
      signupsMap.set(dateKey, parseInt(r.signups || 0));
    }

    // 3) Construir rows[] com spend + signups + cac por linha
    const rows = [];
    let spendTotal = 0;
    let signupsTotal = 0;

    for (const r of spendRes.rows) {
      const dateKey = r.period_date instanceof Date 
        ? r.period_date.toISOString().slice(0, 10) 
        : String(r.period_date).slice(0, 10);
      const spend = parseFloat(r.spend || 0);
      const signups = signupsMap.get(dateKey) || 0;

      // Se onlySigned=true, só incluir linhas onde há assinaturas
      if (onlySigned && signups === 0) continue;

      const cac = signups > 0 ? spend / signups : 0;
      spendTotal += spend;

      rows.push({
        date: dateKey,
        channel: r.channel,
        description: r.description || "",
        spend: Math.round(spend * 100), // centavos
        signups,
        cac: Math.round(cac * 100), // centavos
      });
    }

    // Calcular signupsTotal (único por período, não duplicar)
    for (const [, v] of signupsMap) {
      signupsTotal += v;
    }

    const cacTotal = signupsTotal > 0 ? spendTotal / signupsTotal : 0;

    res.json({
      unit: "cents",
      currency: "BRL",
      summary: {
        spendTotal: Math.round(spendTotal * 100),
        signupsTotal,
        cac: Math.round(cacTotal * 100),
      },
      rows,
    });
  } catch (err) {
    console.error("[cac-real/details] error:", err);
    res.status(500).json({ error: "Erro ao calcular CAC detalhado" });
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
