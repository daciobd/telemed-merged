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
// NOTA: consultations NÃO tem campos UTM. CAC é calculado como:
//   - Gastos: ads_spend_daily.provider (canal) + campaign_name
//   - Conversões: prontuarios_consulta.signed_at (global por período)
//   - Receita: consultations.platform_fee (via JOIN consulta_id)
// ALOCAÇÃO PROPORCIONAL: signups e revenue são distribuídos por share de gasto dentro do período
router.get("/cac-real/details", async (req, res) => {
  try {
    const from = (req.query.from || "").trim();
    const to = (req.query.to || "").trim();
    const provider = (req.query.provider || "").trim();
    const campaign = (req.query.campaign || "").trim();
    const onlySigned = req.query.onlySigned === "1" || String(req.query.onlySigned || "").toLowerCase() === "true";
    const groupBy = (req.query.groupBy || "day").trim();
    const truncUnit = groupBy === "week" ? "week" : "day";

    if (!from || !to) {
      return res.status(400).json({ error: "Missing required query params: from, to (YYYY-MM-DD)" });
    }

    // Param builder
    const params = [];
    let p = 0;
    params.push(from); p++;
    const pFrom = `$${p}`;
    params.push(to); p++;
    const pTo = `$${p}`;

    const spendWhere = [];
    if (provider) {
      params.push(provider); p++;
      spendWhere.push(`asd.provider = $${p}`);
    }
    if (campaign) {
      params.push(campaign); p++;
      spendWhere.push(`asd.campaign_name ILIKE $${p}`);
    }

    const spendFilterSQL = spendWhere.length ? `AND ${spendWhere.join(" AND ")}` : "";

    // ads_spend_daily.spend está em REAIS (numeric), convertemos para cents
    const sql = `
      WITH spend AS (
        SELECT
          date_trunc('${truncUnit}', asd.date::timestamp)::date AS period,
          COALESCE(asd.provider, 'unknown') AS provider,
          COALESCE(asd.campaign_name, 'unknown') AS campaign_name,
          SUM(ROUND(COALESCE(asd.spend, 0) * 100))::bigint AS spend_cents
        FROM ads_spend_daily asd
        WHERE asd.date::date >= ${pFrom}::date
          AND asd.date::date <= ${pTo}::date
          ${spendFilterSQL}
        GROUP BY 1,2,3
      ),
      spend_period AS (
        SELECT
          period,
          SUM(spend_cents)::bigint AS spend_total_cents
        FROM spend
        GROUP BY 1
      ),
      conv AS (
        SELECT
          date_trunc('${truncUnit}', pc.signed_at)::date AS period,
          COUNT(*)::int AS signups_total,
          SUM(ROUND(COALESCE(cons.platform_fee, 0) * 100))::bigint AS revenue_total_cents
        FROM prontuarios_consulta pc
        LEFT JOIN consultations cons ON cons.id::text = pc.consulta_id
        WHERE pc.signed_at IS NOT NULL
          AND pc.signed_at::date >= ${pFrom}::date
          AND pc.signed_at::date <= ${pTo}::date
        GROUP BY 1
      ),
      joined AS (
        SELECT
          s.period,
          s.provider,
          s.campaign_name,
          s.spend_cents,
          sp.spend_total_cents,
          COALESCE(c.signups_total, 0)::int AS signups_total,
          COALESCE(c.revenue_total_cents, 0)::bigint AS revenue_total_cents,
          CASE
            WHEN sp.spend_total_cents > 0 THEN (s.spend_cents::numeric / sp.spend_total_cents::numeric)
            ELSE 0::numeric
          END AS spend_share
        FROM spend s
        JOIN spend_period sp ON sp.period = s.period
        LEFT JOIN conv c ON c.period = s.period
      )
      SELECT
        period,
        provider,
        campaign_name,
        spend_cents,
        spend_total_cents,
        signups_total,
        revenue_total_cents,
        spend_share,
        ROUND(signups_total * spend_share)::int AS signups_alloc,
        ROUND(revenue_total_cents::numeric * spend_share)::bigint AS revenue_alloc_cents,
        CASE
          WHEN ROUND(signups_total * spend_share)::int > 0
            THEN (spend_cents / ROUND(signups_total * spend_share)::int)::bigint
          ELSE NULL
        END AS cac_cents_alloc
      FROM joined
      ${onlySigned ? "WHERE ROUND(signups_total * spend_share)::int > 0" : ""}
      ORDER BY period DESC, provider ASC, campaign_name ASC;
    `;

    const { rows } = await pool.query(sql, params);

    // Totais de gasto
    let spendTotal = 0;
    for (const r of rows) {
      spendTotal += parseInt(r.spend_cents || 0);
    }

    // Totais globais (via query separada para evitar erros de arredondamento)
    const totalsSql = `
      SELECT
        COUNT(*)::int AS signups_total,
        SUM(ROUND(COALESCE(cons.platform_fee, 0) * 100))::bigint AS revenue_total_cents
      FROM prontuarios_consulta pc
      LEFT JOIN consultations cons ON cons.id::text = pc.consulta_id
      WHERE pc.signed_at IS NOT NULL
        AND pc.signed_at::date >= $1::date
        AND pc.signed_at::date <= $2::date;
    `;
    const totalsRes = await pool.query(totalsSql, [from, to]);
    const signupsTotal = parseInt(totalsRes.rows?.[0]?.signups_total || 0);
    const revenueTotal = parseInt(totalsRes.rows?.[0]?.revenue_total_cents || 0);
    const cacTotal = signupsTotal > 0 ? Math.floor(spendTotal / signupsTotal) : null;

    res.json({
      range: { from, to, groupBy: truncUnit, provider: provider || null, campaign: campaign || null, onlySigned },
      unit: "cents",
      currency: "BRL",
      totals: {
        spend_cents: spendTotal,
        signups: signupsTotal,
        revenue_cents: revenueTotal,
        cac_cents: cacTotal,
      },
      rows: rows.map((r) => ({
        period: r.period instanceof Date ? r.period.toISOString().slice(0, 10) : String(r.period).slice(0, 10),
        provider: r.provider,
        campaign_name: r.campaign_name,
        spend_cents: parseInt(r.spend_cents || 0),
        spend_total_cents_period: parseInt(r.spend_total_cents || 0),
        signups_total_period: parseInt(r.signups_total || 0),
        revenue_total_cents_period: parseInt(r.revenue_total_cents || 0),
        spend_share: parseFloat(r.spend_share || 0),
        signups_alloc: parseInt(r.signups_alloc || 0),
        revenue_alloc_cents: parseInt(r.revenue_alloc_cents || 0),
        cac_cents_alloc: r.cac_cents_alloc === null ? null : parseInt(r.cac_cents_alloc),
      })),
    });
  } catch (err) {
    console.error("[cac-real/details] error:", err);
    res.status(500).json({ error: "Erro ao calcular CAC detalhado" });
  }
});

// CAC Real Alerts - endpoint para alertas automáticos de CAC
router.get("/cac-real/alerts", async (req, res) => {
  try {
    const days = Math.max(1, Number(req.query.days || 7));
    const cacMax = Number(req.query.cacMax || 20000); // R$200,00 em cents
    const minSignups = Number(req.query.minSignups || 1);
    const minSpend = Number(req.query.minSpend || 5000); // R$50,00 em cents

    // range: últimos N dias (inclui hoje)
    const rangeSql = `
      SELECT
        (CURRENT_DATE - ($1::int - 1))::date AS from_date,
        CURRENT_DATE::date AS to_date
    `;
    const rangeRes = await pool.query(rangeSql, [days]);
    const from = rangeRes.rows[0].from_date;
    const to = rangeRes.rows[0].to_date;

    // spend (convertendo de reais para cents)
    const spendSql = `
      SELECT COALESCE(SUM(ROUND(COALESCE(spend,0)*100)),0)::bigint AS spend_cents
      FROM ads_spend_daily
      WHERE date::date >= $1::date AND date::date <= $2::date
    `;
    const spendRes = await pool.query(spendSql, [from, to]);
    const spendCents = parseInt(spendRes.rows[0].spend_cents || 0);

    // signups + revenue
    const convSql = `
      SELECT
        COUNT(*)::int AS signups,
        COALESCE(SUM(ROUND(COALESCE(cons.platform_fee,0)*100)),0)::bigint AS revenue_cents
      FROM prontuarios_consulta pc
      LEFT JOIN consultations cons ON cons.id::text = pc.consulta_id
      WHERE pc.signed_at IS NOT NULL
        AND pc.signed_at::date >= $1::date
        AND pc.signed_at::date <= $2::date
    `;
    const convRes = await pool.query(convSql, [from, to]);
    const signups = parseInt(convRes.rows[0].signups || 0);
    const revenueCents = parseInt(convRes.rows[0].revenue_cents || 0);

    const cacCents = signups > 0 ? Math.floor(spendCents / signups) : null;

    const alerts = [];

    // 1) gastando sem assinatura
    if (spendCents >= minSpend && signups < minSignups) {
      alerts.push({
        code: "SPEND_WITHOUT_SIGNUPS",
        severity: "high",
        message: `Gasto relevante sem assinaturas no período (${days}d).`,
        metrics: { from, to, spendCents, signups, revenueCents, cacCents },
      });
    }

    // 2) CAC explodindo
    if (cacCents != null && cacCents >= cacMax && signups >= minSignups) {
      alerts.push({
        code: "CAC_TOO_HIGH",
        severity: "high",
        message: `CAC acima do limite no período (${days}d).`,
        metrics: { from, to, spendCents, signups, revenueCents, cacCents, cacMax },
      });
    }

    // 3) queda de assinaturas com gasto (alerta "médio")
    if (spendCents >= minSpend && signups > 0 && signups < Math.max(2, minSignups)) {
      alerts.push({
        code: "LOW_SIGNUPS_WITH_SPEND",
        severity: "medium",
        message: `Poucas assinaturas para o nível de gasto no período (${days}d).`,
        metrics: { from, to, spendCents, signups, revenueCents, cacCents },
      });
    }

    res.json({
      ok: alerts.length === 0,
      range: { from, to, days },
      thresholds: { cacMax, minSignups, minSpend },
      metrics: { spendCents, signups, revenueCents, cacCents },
      alerts,
    });
  } catch (err) {
    console.error("[cac-real/alerts] error:", err);
    res.status(500).json({ error: "Failed to compute CAC alerts" });
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
