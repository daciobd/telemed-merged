import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";

const router = express.Router();

// ============================================
// HELPERS: parseAllowlist
// ============================================
function parseAllowlist(raw) {
  return (raw || "")
    .split(/[;,]/g)
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
}

// ============================================
// MIDDLEWARE: requireManager
// Permite acesso apenas para quem está na allowlist
// MANAGER_EMAILS ou MANAGER_CRMS (env vars)
// ============================================
function requireManager(req, res, next) {
  const allowEmails = parseAllowlist(process.env.MANAGER_EMAILS);
  const allowCrms = parseAllowlist(process.env.MANAGER_CRMS);

  // Tentar extrair user do token JWT
  let user = null;
  const token = req.headers.authorization?.split(" ")[1];
  
  if (token) {
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Token inválido
    }
  }

  // Fallback para req.user ou req.session?.user
  if (!user) {
    user = req.user || req.session?.user || null;
  }

  // Extrair email (vários formatos possíveis)
  const email = (user?.email || user?.user_email || user?.login || "")
    .toString()
    .trim()
    .toLowerCase();

  // Extrair CRM (fallback)
  const crm = (user?.crm || user?.crm_numero || "")
    .toString()
    .trim()
    .toLowerCase();

  // Verificar allowlist
  if ((email && allowEmails.includes(email)) || (crm && allowCrms.includes(crm))) {
    return next();
  }

  // Fallback: verificar role admin/manager/gerente
  const role = user?.role || user?.perfil || user?.type;
  if (role === "admin" || role === "manager" || role === "gerente") {
    return next();
  }

  return res.status(403).json({ ok: false, error: "Acesso restrito" });
}

// ============================================
// ENDPOINT: GET /manager/_debug-token (TEMPORÁRIO)
// ============================================
router.get("/manager/_debug-token", (req, res) => {
  const expectedToken = process.env.MANAGER_TOKEN || "";
  const expectedEmails = process.env.MANAGER_EMAILS || "";
  const expectedCrms = process.env.MANAGER_CRMS || "";
  
  res.json({
    hasToken: Boolean(expectedToken),
    tokenLen: expectedToken.length,
    tokenStartsWith: expectedToken.slice(0, 6),
    headerSeen: String(req.headers["x-manager-token"] || "").slice(0, 6),
    hasManagerEmails: Boolean(expectedEmails),
    managerEmailsLen: expectedEmails.length,
    hasManagerCrms: Boolean(expectedCrms),
  });
});

// ============================================
// ENDPOINT: GET /manager/stats
// ============================================
router.get("/manager/stats", requireManager, async (req, res) => {
  try {
    // Totais gerais
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

    const totals = {
      prontuarios_total: qTotal.rows[0]?.n || 0,
      prontuarios_final: qFinal.rows[0]?.n || 0,
      prontuarios_draft: qDraft.rows[0]?.n || 0,
      prontuarios_assinados: assinados,
    };

    // Métricas de HOJE
    let today = { total: 0, final: 0, draft: 0 };
    try {
      const qToday = await pool.query(`
        SELECT
          count(*)::int as total,
          sum(case when status='final' then 1 else 0 end)::int as final,
          sum(case when status='draft' then 1 else 0 end)::int as draft
        FROM prontuarios_consulta
        WHERE created_at >= date_trunc('day', now())
      `);
      const r = qToday.rows[0];
      today = {
        total: Number(r?.total ?? 0),
        final: Number(r?.final ?? 0),
        draft: Number(r?.draft ?? 0),
      };
    } catch {
      // mantém zeros
    }

    // Tempo médio até finalização (em minutos)
    let avg_time_to_finalize_minutes = null;
    try {
      const qAvg = await pool.query(`
        SELECT
          avg(extract(epoch from (updated_at - created_at))/60)::float as avg_minutes
        FROM prontuarios_consulta
        WHERE status = 'final'
      `);
      const r = qAvg.rows[0];
      avg_time_to_finalize_minutes = r?.avg_minutes != null ? Math.round(Number(r.avg_minutes) * 10) / 10 : null;
    } catch {
      avg_time_to_finalize_minutes = null;
    }

    // Taxas de conversão
    const conversion = {
      finalized_rate: totals.prontuarios_total > 0 
        ? Math.round((totals.prontuarios_final / totals.prontuarios_total) * 100) 
        : 0,
      signed_rate_of_final: totals.prontuarios_final > 0 
        ? Math.round((totals.prontuarios_assinados / totals.prontuarios_final) * 100) 
        : 0,
    };

    // Últimos 7 dias
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
      totals,
      today,
      avg_time_to_finalize_minutes,
      conversion,
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
