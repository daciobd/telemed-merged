import express from "express";
import { pool } from "../db/pool.js";

const router = express.Router();

router.get("/stats", async (req, res) => {
  try {
    const qTotal = await pool.query(
      `SELECT count(*)::int as n FROM prontuarios_consulta`
    );
    const qFinal = await pool.query(
      `SELECT count(*)::int as n FROM prontuarios_consulta WHERE status = 'final'`
    );
    const qDraft = await pool.query(
      `SELECT count(*)::int as n FROM prontuarios_consulta WHERE status = 'draft'`
    );

    let assinados = 0;
    try {
      const qAss = await pool.query(
        `SELECT count(*)::int as n
         FROM prontuarios_consulta
         WHERE ia_metadata IS NOT NULL
           AND (ia_metadata->>'assinatura') IS NOT NULL
           AND (ia_metadata->>'assinatura') <> ''`
      );
      assinados = qAss.rows[0]?.n || 0;
    } catch {
      assinados = 0;
    }

    let last7days = [];
    try {
      const qDays = await pool.query(
        `SELECT
           to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as date,
           count(*)::int as total,
           sum(case when status='final' then 1 else 0 end)::int as final,
           sum(case when status='draft' then 1 else 0 end)::int as draft
         FROM prontuarios_consulta
         WHERE created_at >= now() - interval '7 days'
         GROUP BY 1
         ORDER BY 1 ASC`
      );
      last7days = qDays.rows.map((r) => ({
        date: r.date,
        total: Number(r.total ?? 0),
        final: Number(r.final ?? 0),
        draft: Number(r.draft ?? 0),
      }));
    } catch {
      last7days = [];
    }

    return res.json({
      ok: true,
      available: true,
      updated_at: new Date().toISOString(),
      totals: {
        prontuarios_total: qTotal.rows[0]?.n || 0,
        prontuarios_final: qFinal.rows[0]?.n || 0,
        prontuarios_draft: qDraft.rows[0]?.n || 0,
        prontuarios_assinados: assinados,
      },
      last7days,
    });
  } catch (err) {
    console.error("[stats] erro:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Erro ao gerar stats",
    });
  }
});

export default router;
