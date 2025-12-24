import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";

const router = express.Router();

// ============================================
// MIDDLEWARE: requireManager (cópia local)
// ============================================
function requireManager(req, res, next) {
  try {
    let user = null;
    const token = req.headers.authorization?.split(" ")[1];
    
    if (token) {
      try {
        user = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        // Token inválido
      }
    }

    if (!user) {
      user = req.user || req.session?.user;
    }

    if (!user) {
      return res.status(401).json({ ok: false, error: "Não autenticado" });
    }

    const role = (user.role || "").toLowerCase();
    if (role === "admin" || role === "manager") {
      return next();
    }

    const emails = (process.env.MANAGER_EMAILS || "")
      .split(",")
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    const email = (user.email || "").toLowerCase();
    if (email && emails.includes(email)) {
      return next();
    }

    return res.status(403).json({ ok: false, error: "Acesso restrito" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Erro de autorização" });
  }
}

// ============================================
// GET /metrics/v2 - Funil clínico-operacional
// Query params: ?days=30 (default 30, max 365)
// ============================================
router.get("/metrics/v2", requireManager, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days ?? 30)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Query principal do funil
    const funnelQuery = await pool.query(`
      SELECT
        count(*)::int AS criados,
        count(finalized_at)::int AS finalizados,
        
        -- assinados = signed_at OU proxy no ia_metadata
        sum(case 
          when signed_at IS NOT NULL 
            OR (ia_metadata->>'assinatura' IS NOT NULL AND ia_metadata->>'assinatura' <> '')
          then 1 else 0 
        end)::int AS assinados,
        
        -- tempo médio até finalizar (minutos)
        avg(
          case
            when finalized_at IS NOT NULL
            then extract(epoch from (finalized_at - created_at)) / 60
            else null
          end
        ) AS tempo_medio_ate_finalizar_min,
        
        -- tempo médio até assinar (minutos) - só com signed_at real
        avg(
          case
            when signed_at IS NOT NULL AND finalized_at IS NOT NULL
            then extract(epoch from (signed_at - finalized_at)) / 60
            else null
          end
        ) AS tempo_medio_ate_assinar_min,
        
        -- finalizados sem assinatura (pendência)
        sum(case 
          when finalized_at IS NOT NULL 
            AND signed_at IS NULL
            AND (ia_metadata->>'assinatura' IS NULL OR ia_metadata->>'assinatura' = '')
          then 1 else 0 
        end)::int AS finalizados_sem_assinatura
        
      FROM prontuarios_consulta
      WHERE created_at >= $1
    `, [since]);

    const row = funnelQuery.rows[0] || {};
    
    const criados = row.criados ?? 0;
    const finalizados = row.finalizados ?? 0;
    const assinados = row.assinados ?? 0;
    
    const taxaFinalizacao = criados > 0 ? Math.round((finalizados / criados) * 100) : 0;
    const taxaAssinatura = finalizados > 0 ? Math.round((assinados / finalizados) * 100) : 0;

    return res.json({
      ok: true,
      range: { days, since: since.toISOString() },
      funnel: {
        criados,
        finalizados,
        assinados,
        taxaFinalizacao,
        taxaAssinatura,
      },
      tempos: {
        tempoMedioAteFinalizarMin: row.tempo_medio_ate_finalizar_min 
          ? Math.round(Number(row.tempo_medio_ate_finalizar_min) * 10) / 10 
          : null,
        tempoMedioAteAssinarMin: row.tempo_medio_ate_assinar_min 
          ? Math.round(Number(row.tempo_medio_ate_assinar_min) * 10) / 10 
          : null,
      },
      pendencias: {
        finalizadosSemAssinatura: row.finalizados_sem_assinatura ?? 0,
      },
      notas: {
        assinadosUsaProxy: true,
      },
    });
  } catch (err) {
    console.error("[manager/metrics/v2] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao gerar métricas" });
  }
});

// ============================================
// GET /metrics/v2/doctors - Produção por médico
// Query params: ?days=30 (default 30)
// ============================================
router.get("/metrics/v2/doctors", requireManager, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days ?? 30)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const doctorsQuery = await pool.query(`
      SELECT
        medico_id,
        count(*)::int AS total,
        count(finalized_at)::int AS finalizados,
        sum(case when finalized_at IS NULL then 1 else 0 end)::int AS rascunhos,
        
        -- assinados (signed_at OU proxy)
        sum(case 
          when signed_at IS NOT NULL 
            OR (ia_metadata->>'assinatura' IS NOT NULL AND ia_metadata->>'assinatura' <> '')
          then 1 else 0 
        end)::int AS assinados,
        
        -- finalizados sem assinatura
        sum(case 
          when finalized_at IS NOT NULL 
            AND signed_at IS NULL
            AND (ia_metadata->>'assinatura' IS NULL OR ia_metadata->>'assinatura' = '')
          then 1 else 0 
        end)::int AS finalizados_sem_assinatura
        
      FROM prontuarios_consulta
      WHERE created_at >= $1
        AND medico_id IS NOT NULL
      GROUP BY medico_id
      ORDER BY total DESC
      LIMIT 100
    `, [since]);

    const doctors = doctorsQuery.rows.map(row => ({
      medicoId: row.medico_id,
      total: row.total,
      finalizados: row.finalizados,
      rascunhos: row.rascunhos,
      assinados: row.assinados,
      finalizadosSemAssinatura: row.finalizados_sem_assinatura,
      taxaFinalizacao: row.total > 0 ? Math.round((row.finalizados / row.total) * 100) : 0,
    }));

    return res.json({
      ok: true,
      range: { days, since: since.toISOString() },
      doctors,
      total: doctors.length,
    });
  } catch (err) {
    console.error("[manager/metrics/v2/doctors] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao gerar métricas por médico" });
  }
});

export default router;
