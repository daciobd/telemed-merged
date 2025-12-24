import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";

const router = express.Router();

// ============================================
// CACHE EM MEMÓRIA (30s TTL)
// ============================================
const cache = new Map();
const CACHE_TTL = 30_000; // 30 segundos

function getCached(key) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) {
    return hit.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, { at: Date.now(), data });
}

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
    
    // Cache check
    const cacheKey = `metrics-v2:${days}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);
    
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

    const result = {
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
    };
    
    setCache(cacheKey, result);
    return res.json(result);
  } catch (err) {
    console.error("[manager/metrics/v2] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao gerar métricas" });
  }
});

// ============================================
// GET /metrics/v2/doctors - Produção por médico (com nome via JOIN)
// Query params: ?days=30 (default 30)
// ============================================
router.get("/metrics/v2/doctors", requireManager, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days ?? 30)));
    
    // Cache check
    const cacheKey = `metrics-v2-doctors:${days}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);
    
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const doctorsQuery = await pool.query(`
      SELECT
        p.medico_id,
        u.full_name AS medico_nome,
        u.email AS medico_email,
        count(*)::int AS total,
        count(p.finalized_at)::int AS finalizados,
        sum(case when p.finalized_at IS NULL then 1 else 0 end)::int AS rascunhos,
        
        -- assinados (signed_at OU proxy)
        sum(case 
          when p.signed_at IS NOT NULL 
            OR (p.ia_metadata->>'assinatura' IS NOT NULL AND p.ia_metadata->>'assinatura' <> '')
          then 1 else 0 
        end)::int AS assinados,
        
        -- finalizados sem assinatura (pendências)
        sum(case 
          when p.finalized_at IS NOT NULL 
            AND p.signed_at IS NULL
            AND (p.ia_metadata->>'assinatura' IS NULL OR p.ia_metadata->>'assinatura' = '')
          then 1 else 0 
        end)::int AS finalizados_sem_assinatura
        
      FROM prontuarios_consulta p
      LEFT JOIN users u ON u.id::text = p.medico_id
      WHERE p.created_at >= $1
        AND p.medico_id IS NOT NULL
      GROUP BY p.medico_id, u.full_name, u.email
      ORDER BY total DESC
      LIMIT 100
    `, [since]);

    const doctors = doctorsQuery.rows.map(row => ({
      medicoId: row.medico_id,
      medicoNome: row.medico_nome || "Médico não identificado",
      medicoEmail: row.medico_email,
      total: row.total,
      finalizados: row.finalizados,
      rascunhos: row.rascunhos,
      assinados: row.assinados,
      finalizadosSemAssinatura: row.finalizados_sem_assinatura,
      taxaFinalizacao: row.total > 0 ? Math.round((row.finalizados / row.total) * 100) : 0,
    }));

    const result = {
      ok: true,
      range: { days, since: since.toISOString() },
      doctors,
      total: doctors.length,
    };
    
    setCache(cacheKey, result);
    return res.json(result);
  } catch (err) {
    console.error("[manager/metrics/v2/doctors] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao gerar métricas por médico" });
  }
});

// ============================================
// GET /metrics/v2/daily - Série diária com timezone America/Sao_Paulo
// Query params: ?days=30 (default 30)
// ============================================
router.get("/metrics/v2/daily", requireManager, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days ?? 30)));
    
    // Cache check
    const cacheKey = `metrics-v2-daily:${days}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);
    
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Série diária com timezone correto (America/Sao_Paulo)
    const dailyQuery = await pool.query(`
      SELECT
        to_char(
          date_trunc('day', created_at AT TIME ZONE 'America/Sao_Paulo'),
          'YYYY-MM-DD'
        ) AS dia,
        count(*)::int AS criados,
        count(finalized_at)::int AS finalizados,
        sum(case 
          when signed_at IS NOT NULL 
            OR (ia_metadata->>'assinatura' IS NOT NULL AND ia_metadata->>'assinatura' <> '')
          then 1 else 0 
        end)::int AS assinados
      FROM prontuarios_consulta
      WHERE created_at >= $1
      GROUP BY 1
      ORDER BY 1
    `, [since]);

    const result = {
      ok: true,
      range: { days, since: since.toISOString() },
      timezone: "America/Sao_Paulo",
      series: dailyQuery.rows.map(r => ({
        dia: r.dia,
        criados: r.criados,
        finalizados: r.finalizados,
        assinados: r.assinados,
      })),
    };
    
    setCache(cacheKey, result);
    return res.json(result);
  } catch (err) {
    console.error("[manager/metrics/v2/daily] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao gerar série diária" });
  }
});

// ============================================
// GET /metrics/v2/pending/unsigned - Listagem finalizados sem assinatura
// Query params: ?days=30&limit=200&offset=0&medico_id=...
// ============================================
router.get("/metrics/v2/pending/unsigned", requireManager, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days ?? 30)));
    const limit = Math.max(1, Math.min(500, Number(req.query.limit ?? 200)));
    const offset = Math.max(0, Number(req.query.offset ?? 0));
    const medicoId = req.query.medico_id ? String(req.query.medico_id) : null;

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Query com JOIN para trazer nome do médico
    let query = `
      SELECT
        p.id,
        p.consulta_id,
        p.medico_id,
        u.full_name AS medico_nome,
        u.email AS medico_email,
        p.created_at,
        p.finalized_at,
        p.signed_at,
        
        -- proxy da assinatura no JSON
        CASE 
          WHEN (p.ia_metadata->>'assinatura') IS NOT NULL 
           AND (p.ia_metadata->>'assinatura') <> ''
          THEN true ELSE false 
        END AS has_assinatura_proxy,
        
        -- tempo parado (desde finalized_at até agora) em minutos
        ROUND(EXTRACT(EPOCH FROM (NOW() - p.finalized_at)) / 60)::int AS tempo_parado_min,
        
        -- tempo até finalizar (created → finalized) em minutos
        CASE
          WHEN p.finalized_at IS NOT NULL
          THEN ROUND(EXTRACT(EPOCH FROM (p.finalized_at - p.created_at)) / 60)::int
          ELSE NULL
        END AS tempo_ate_finalizar_min
        
      FROM prontuarios_consulta p
      LEFT JOIN users u ON u.id::text = p.medico_id
      WHERE p.created_at >= $1
        AND p.finalized_at IS NOT NULL
        AND p.signed_at IS NULL
        AND (p.ia_metadata->>'assinatura' IS NULL OR p.ia_metadata->>'assinatura' = '')
    `;

    const params = [since];

    if (medicoId) {
      query += ` AND p.medico_id = $${params.length + 1}`;
      params.push(medicoId);
    }

    query += ` ORDER BY p.finalized_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Total para paginação
    let countQuery = `
      SELECT COUNT(*)::int AS total
      FROM prontuarios_consulta p
      WHERE p.created_at >= $1
        AND p.finalized_at IS NOT NULL
        AND p.signed_at IS NULL
        AND (p.ia_metadata->>'assinatura' IS NULL OR p.ia_metadata->>'assinatura' = '')
    `;
    const countParams = [since];

    if (medicoId) {
      countQuery += ` AND p.medico_id = $2`;
      countParams.push(medicoId);
    }

    const countResult = await pool.query(countQuery, countParams);

    const items = result.rows.map(row => ({
      id: row.id,
      consultaId: row.consulta_id,
      medicoId: row.medico_id,
      medicoNome: row.medico_nome || "Médico não identificado",
      medicoEmail: row.medico_email,
      createdAt: row.created_at,
      finalizedAt: row.finalized_at,
      signedAt: row.signed_at,
      hasAssinaturaProxy: row.has_assinatura_proxy,
      tempoParadoMin: row.tempo_parado_min,
      tempoAteFinalizarMin: row.tempo_ate_finalizar_min,
    }));

    return res.json({
      ok: true,
      range: { days, since: since.toISOString() },
      paging: { limit, offset, total: countResult.rows[0]?.total ?? 0 },
      items,
    });
  } catch (err) {
    console.error("[manager/metrics/v2/pending/unsigned] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao listar pendências" });
  }
});

export default router;
