import express from "express";
import { pool } from "../db/pool.js";

const router = express.Router();

const FUNNEL_EVENTS = [
  "landing_view",
  "offer_created",
  "booking_started",
  "booking_confirmed",
  "consult_started",
  "consult_finished",
  "consult_signed",
];

router.get("/funnel", async (req, res) => {
  const from = req.query.from ? String(req.query.from) : null;
  const to = req.query.to ? String(req.query.to) : null;
  const groupBy = req.query.groupBy ? String(req.query.groupBy) : "none";
  const includeRevenue = String(req.query.includeRevenue || "0") === "1";

  const groupExpr =
    groupBy === "utm_campaign" ? "coalesce(utm_campaign,'(sem campanha)')" :
    groupBy === "utm_source" ? "coalesce(utm_source,'(sem source)')" :
    groupBy === "utm_medium" ? "coalesce(utm_medium,'(sem medium)')" :
    "'all'";

  const groupLabel =
    groupBy === "utm_campaign" ? "utm_campaign" :
    groupBy === "utm_source" ? "utm_source" :
    groupBy === "utm_medium" ? "utm_medium" :
    "all";

  const sql = `
    WITH base AS (
      SELECT
        ${groupExpr} AS grp,
        event_name,
        session_id,
        created_at,
        properties
      FROM telemetry_events
      WHERE
        created_at >= coalesce($1::date, (now() - interval '7 days')::date)
        AND created_at < (coalesce($2::date, now()::date) + interval '1 day')
        AND event_name = ANY($3::text[])
    ),
    counts AS (
      SELECT
        grp,
        event_name,
        COUNT(*) AS events,
        COUNT(DISTINCT session_id) FILTER (WHERE session_id IS NOT NULL) AS sessions
      FROM base
      GROUP BY grp, event_name
    )
    SELECT
      grp AS "${groupLabel}",
      jsonb_object_agg(event_name, jsonb_build_object('events', events, 'sessions', sessions)) AS funnel
    FROM counts
    GROUP BY grp
    ORDER BY grp
  `;

  try {
    const funnelRes = await pool.query(sql, [from, to, FUNNEL_EVENTS]);

    let revenue = null;
    if (includeRevenue) {
      const revenueSql = `
        WITH base AS (
          SELECT
            ${groupExpr} AS grp,
            properties
          FROM telemetry_events
          WHERE
            created_at >= coalesce($1::date, (now() - interval '7 days')::date)
            AND created_at < (coalesce($2::date, now()::date) + interval '1 day')
            AND event_name = 'booking_confirmed'
        )
        SELECT
          grp AS "${groupLabel}",
          COALESCE(SUM((properties->>'agreedPrice')::numeric), 0) AS gmv,
          COALESCE(SUM((properties->>'platformFee')::numeric), 0) AS platform_fee,
          COALESCE(SUM((properties->>'doctorEarnings')::numeric), 0) AS doctor_earnings
        FROM base
        GROUP BY grp
        ORDER BY grp
      `;
      const revRes = await pool.query(revenueSql, [from, to]);
      revenue = revRes.rows;
    }

    const rows = funnelRes.rows.map(r => {
      const funnel = r.funnel || {};
      for (const ev of FUNNEL_EVENTS) {
        if (!funnel[ev]) funnel[ev] = { events: 0, sessions: 0 };
      }

      const landingS = funnel.landing_view?.sessions || 0;
      const bookingS = funnel.booking_confirmed?.sessions || 0;
      const finishedS = funnel.consult_finished?.sessions || 0;

      const conversionRates = {
        landing_to_booking: landingS > 0 ? ((bookingS / landingS) * 100).toFixed(2) : "0.00",
        booking_to_finished: bookingS > 0 ? ((finishedS / bookingS) * 100).toFixed(2) : "0.00",
      };

      return { ...r, funnel, conversionRates };
    });

    res.json({
      from: from || null,
      to: to || null,
      groupBy,
      events: FUNNEL_EVENTS,
      rows,
      revenue,
    });
  } catch (err) {
    console.error("[funnel] metrics error:", err);
    res.status(500).json({ error: "Erro ao gerar funil" });
  }
});

router.get("/funnel/daily", async (req, res) => {
  const from = req.query.from ? String(req.query.from) : null;
  const to = req.query.to ? String(req.query.to) : null;

  const sql = `
    SELECT
      date_trunc('day', created_at)::date AS day,
      event_name,
      COUNT(*) AS events,
      COUNT(DISTINCT session_id) FILTER (WHERE session_id IS NOT NULL) AS sessions
    FROM telemetry_events
    WHERE
      created_at >= coalesce($1::date, (now() - interval '30 days')::date)
      AND created_at < (coalesce($2::date, now()::date) + interval '1 day')
      AND event_name = ANY($3::text[])
    GROUP BY day, event_name
    ORDER BY day DESC, event_name
  `;

  try {
    const { rows } = await pool.query(sql, [from, to, FUNNEL_EVENTS]);
    
    const byDay = {};
    for (const row of rows) {
      const d = row.day.toISOString().split("T")[0];
      if (!byDay[d]) byDay[d] = {};
      byDay[d][row.event_name] = { events: parseInt(row.events), sessions: parseInt(row.sessions) };
    }

    res.json({
      from: from || null,
      to: to || null,
      days: Object.entries(byDay).map(([day, funnel]) => ({ day, funnel })),
    });
  } catch (err) {
    console.error("[funnel] daily error:", err);
    res.status(500).json({ error: "Erro ao gerar funil diário" });
  }
});

export default router;
