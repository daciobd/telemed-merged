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
    // Fallback: aceitar INTERNAL_TOKEN para acesso administrativo
    const token = req.headers.authorization?.split(" ")[1];
    const internalToken = process.env.INTERNAL_TOKEN;
    
    if (token && internalToken && token === internalToken) {
      return next();
    }
    
    let user = null;
    
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
        end)::int AS finalizados_sem_assinatura,
        
        -- SLA: pendências em atenção (>= 60 min paradas)
        sum(case 
          when finalized_at IS NOT NULL 
            AND signed_at IS NULL
            AND (ia_metadata->>'assinatura' IS NULL OR ia_metadata->>'assinatura' = '')
            AND extract(epoch from (now() - finalized_at)) / 60 >= 60
          then 1 else 0 
        end)::int AS pendencias_atencao,
        
        -- SLA: pendências críticas (>= 240 min / 4h paradas)
        sum(case 
          when finalized_at IS NOT NULL 
            AND signed_at IS NULL
            AND (ia_metadata->>'assinatura' IS NULL OR ia_metadata->>'assinatura' = '')
            AND extract(epoch from (now() - finalized_at)) / 60 >= 240
          then 1 else 0 
        end)::int AS pendencias_critico
        
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
        atencao: row.pendencias_atencao ?? 0, // >= 1h parado
        critico: row.pendencias_critico ?? 0, // >= 4h parado
      },
      sla: {
        thresholds: { atencaoMin: 60, criticoMin: 240 },
        description: "OK: <1h | Atenção: 1-4h | Crítico: >4h"
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

// ============================================
// POST /metrics/v2/notify/unsigned - Registrar notificação para médico
// Body: { medicoId, prontuarioId?, days? }
// ============================================
router.post("/metrics/v2/notify/unsigned", requireManager, async (req, res) => {
  try {
    const { medicoId, prontuarioId, days } = req.body ?? {};
    
    if (!medicoId) {
      return res.status(400).json({ ok: false, error: "medicoId obrigatório" });
    }

    // Extrair user do token JWT se disponível
    let managerUserId = null;
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        managerUserId = decoded.id || decoded.userId || null;
      } catch { /* ignore */ }
    }

    const payload = {
      days: Number(days ?? 7),
      prontuarioId: prontuarioId ?? null,
      reason: "Pendência: prontuário finalizado sem assinatura",
      notifiedAt: new Date().toISOString(),
    };

    // Inserir na tabela manager_notifications
    const insertResult = await pool.query(`
      INSERT INTO manager_notifications 
        (manager_user_id, medico_id, prontuario_id, kind, payload)
      VALUES 
        ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `, [
      managerUserId,
      String(medicoId),
      prontuarioId ? String(prontuarioId) : null,
      "unsigned_prontuario",
      payload,
    ]);

    const row = insertResult.rows[0];

    return res.json({
      ok: true,
      notificationId: row.id,
      createdAt: row.created_at,
      message: "Notificação registrada com sucesso",
    });
  } catch (err) {
    console.error("[manager/metrics/v2/notify/unsigned] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao registrar notificação" });
  }
});

// ============================================
// GET /manager-marketplace - Métricas do marketplace (leilão)
// Query params: ?days=7 (default 7, max 90)
// ============================================
router.get("/manager-marketplace", requireManager, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(90, Number(req.query.days ?? 7)));
    
    // Cache check
    const cacheKey = `marketplace:${days}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);
    
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);

    // 1) Consultas marketplace criadas no período
    const baseResult = await pool.query(`
      SELECT COUNT(*)::int AS marketplace_created
      FROM consultations
      WHERE is_marketplace = true
        AND created_at >= $1 AND created_at < $2
    `, [from, to]);

    // 2) Consultas que receberam bids
    const withBidsResult = await pool.query(`
      SELECT COUNT(DISTINCT c.id)::int AS with_bids
      FROM consultations c
      JOIN bids b ON b.consultation_id = c.id
      WHERE c.is_marketplace = true
        AND c.created_at >= $1 AND c.created_at < $2
    `, [from, to]);

    // 3) Total de bids e aceitos
    const bidsAggResult = await pool.query(`
      SELECT
        COUNT(*)::int AS total_bids,
        COUNT(*) FILTER (WHERE is_accepted = true)::int AS accepted_bids
      FROM bids b
      JOIN consultations c ON c.id = b.consultation_id
      WHERE c.is_marketplace = true
        AND c.created_at >= $1 AND c.created_at < $2
    `, [from, to]);

    // 4) Tempo até o 1º bid
    const timeToFirstBidResult = await pool.query(`
      WITH first_bid AS (
        SELECT
          c.id AS consultation_id,
          EXTRACT(EPOCH FROM (MIN(b.created_at) - c.created_at)) / 60.0 AS minutes_to_first_bid
        FROM consultations c
        JOIN bids b ON b.consultation_id = c.id
        WHERE c.is_marketplace = true
          AND c.created_at >= $1 AND c.created_at < $2
        GROUP BY c.id
      )
      SELECT
        AVG(minutes_to_first_bid) AS avg_minutes,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY minutes_to_first_bid) AS p50_minutes
      FROM first_bid
    `, [from, to]);

    // 5) Tempo até aceitar
    const timeToAcceptResult = await pool.query(`
      WITH first_accept AS (
        SELECT
          c.id AS consultation_id,
          EXTRACT(EPOCH FROM (MIN(b.created_at) - c.created_at)) / 60.0 AS minutes_to_accept
        FROM consultations c
        JOIN bids b ON b.consultation_id = c.id
        WHERE c.is_marketplace = true
          AND c.created_at >= $1 AND c.created_at < $2
          AND b.is_accepted = true
        GROUP BY c.id
      )
      SELECT AVG(minutes_to_accept) AS avg_minutes_to_accept
      FROM first_accept
    `, [from, to]);

    // 6) Distribuição dos valores de bids
    const bidAmountDistResult = await pool.query(`
      SELECT
        MIN(bid_amount)::numeric AS min,
        AVG(bid_amount)::numeric AS avg,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY bid_amount) AS p50,
        percentile_cont(0.9) WITHIN GROUP (ORDER BY bid_amount) AS p90,
        MAX(bid_amount)::numeric AS max
      FROM bids b
      JOIN consultations c ON c.id = b.consultation_id
      WHERE c.is_marketplace = true
        AND c.created_at >= $1 AND c.created_at < $2
    `, [from, to]);

    // 7) Top médicos por bids
    const topDoctorsResult = await pool.query(`
      SELECT
        d.id AS doctor_id,
        u.full_name AS doctor_name,
        COUNT(b.id)::int AS bids,
        COUNT(b.id) FILTER (WHERE b.is_accepted = true)::int AS accepted
      FROM bids b
      JOIN doctors d ON d.id = b.doctor_id
      JOIN users u ON u.id = d.user_id
      JOIN consultations c ON c.id = b.consultation_id
      WHERE c.is_marketplace = true
        AND c.created_at >= $1 AND c.created_at < $2
      GROUP BY d.id, u.full_name
      ORDER BY bids DESC
      LIMIT 20
    `, [from, to]);

    const marketplaceCreated = Number(baseResult.rows[0]?.marketplace_created ?? 0);
    const withBids = Number(withBidsResult.rows[0]?.with_bids ?? 0);
    const totalBids = Number(bidsAggResult.rows[0]?.total_bids ?? 0);
    const acceptedBids = Number(bidsAggResult.rows[0]?.accepted_bids ?? 0);

    const avgMinutesToFirstBid = Number(timeToFirstBidResult.rows[0]?.avg_minutes ?? 0);
    const p50MinutesToFirstBid = Number(timeToFirstBidResult.rows[0]?.p50_minutes ?? 0);
    const avgMinutesToAccept = Number(timeToAcceptResult.rows[0]?.avg_minutes_to_accept ?? 0);

    const dist = bidAmountDistResult.rows[0] ?? {};
    
    const topDoctors = topDoctorsResult.rows.map(r => ({
      doctorId: r.doctor_id,
      doctorName: r.doctor_name || "Médico",
      bids: r.bids,
      accepted: r.accepted,
    }));

    const result = {
      ok: true,
      range: { days, from: from.toISOString(), to: to.toISOString() },
      cards: {
        marketplaceCreated,
        withBids,
        totalBids,
        acceptedBids,
        coverageRate: marketplaceCreated > 0 ? Math.round((withBids / marketplaceCreated) * 10000) / 10000 : 0,
        acceptRate: totalBids > 0 ? Math.round((acceptedBids / totalBids) * 10000) / 10000 : 0,
      },
      timing: {
        avgMinutesToFirstBid: Math.round(avgMinutesToFirstBid * 10) / 10,
        p50MinutesToFirstBid: Math.round(p50MinutesToFirstBid * 10) / 10,
        avgMinutesToAccept: Math.round(avgMinutesToAccept * 10) / 10,
      },
      bidAmount: {
        min: dist.min ? Number(dist.min) : null,
        avg: dist.avg ? Math.round(Number(dist.avg) * 100) / 100 : null,
        p50: dist.p50 ? Number(dist.p50) : null,
        p90: dist.p90 ? Number(dist.p90) : null,
        max: dist.max ? Number(dist.max) : null,
      },
      topDoctors,
    };

    setCache(cacheKey, result);
    return res.json(result);
  } catch (err) {
    console.error("[manager-marketplace] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao gerar métricas marketplace" });
  }
});

// ============================================
// MIDDLEWARE: requireInternalToken (para cron jobs)
// ============================================
function requireInternalToken(req, res, next) {
  const token = req.header("x-internal-token") || req.headers.authorization?.split(" ")[1];
  const expectedToken = process.env.INTERNAL_TOKEN || process.env.INTERNAL_CRON_TOKEN;
  
  if (!token || !expectedToken || token !== expectedToken) {
    return res.status(401).json({ ok: false, error: "Não autorizado (token inválido)" });
  }
  return next();
}

// ============================================
// GET /manager-marketplace-sla - SLA detalhado com percentis e buckets
// Query params: ?days=90&verifiedOnly=0
// ============================================
router.get("/manager-marketplace-sla", requireManager, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days ?? 90)));
    const verifiedOnly = req.query.verifiedOnly === "1" || req.query.verifiedOnly === "true";
    
    const cacheKey = `marketplace-sla:${days}:${verifiedOnly}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);
    
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);

    // Filtro de médicos verificados (opcional)
    const verifiedFilter = verifiedOnly 
      ? "AND d.is_verified = true AND d.is_active = true" 
      : "";

    // 1) Tempo até 1º bid - percentis p50/p90/p95
    const timingBidResult = await pool.query(`
      WITH first_bid AS (
        SELECT
          c.id AS consultation_id,
          EXTRACT(EPOCH FROM (MIN(b.created_at) - c.created_at)) / 60.0 AS minutes
        FROM consultations c
        JOIN bids b ON b.consultation_id = c.id
        JOIN doctors d ON d.id = b.doctor_id
        WHERE c.is_marketplace = true
          AND c.created_at >= $1 AND c.created_at < $2
          ${verifiedFilter}
        GROUP BY c.id
      )
      SELECT
        COALESCE(AVG(minutes), 0)::float AS avg,
        COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY minutes), 0)::float AS p50,
        COALESCE(percentile_cont(0.9) WITHIN GROUP (ORDER BY minutes), 0)::float AS p90,
        COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY minutes), 0)::float AS p95
      FROM first_bid
    `, [from, to]);

    // 2) Tempo até aceitar - percentis p50/p90/p95
    const timingAcceptResult = await pool.query(`
      WITH first_accept AS (
        SELECT
          c.id AS consultation_id,
          EXTRACT(EPOCH FROM (MIN(b.created_at) - c.created_at)) / 60.0 AS minutes
        FROM consultations c
        JOIN bids b ON b.consultation_id = c.id
        JOIN doctors d ON d.id = b.doctor_id
        WHERE c.is_marketplace = true
          AND c.created_at >= $1 AND c.created_at < $2
          AND b.is_accepted = true
          ${verifiedFilter}
        GROUP BY c.id
      )
      SELECT
        COALESCE(AVG(minutes), 0)::float AS avg,
        COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY minutes), 0)::float AS p50,
        COALESCE(percentile_cont(0.9) WITHIN GROUP (ORDER BY minutes), 0)::float AS p90,
        COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY minutes), 0)::float AS p95
      FROM first_accept
    `, [from, to]);

    // 3) Buckets: % consultas com bid em até X minutos
    const bucketsBidResult = await pool.query(`
      WITH first_bid AS (
        SELECT
          c.id AS consultation_id,
          EXTRACT(EPOCH FROM (MIN(b.created_at) - c.created_at)) / 60.0 AS minutes
        FROM consultations c
        JOIN bids b ON b.consultation_id = c.id
        JOIN doctors d ON d.id = b.doctor_id
        WHERE c.is_marketplace = true
          AND c.created_at >= $1 AND c.created_at < $2
          ${verifiedFilter}
        GROUP BY c.id
      ),
      total AS (
        SELECT COUNT(*)::float AS total FROM consultations c
        WHERE c.is_marketplace = true
          AND c.created_at >= $1 AND c.created_at < $2
      )
      SELECT
        t.total AS total_consultas,
        COUNT(*) FILTER (WHERE fb.minutes <= 5)::int AS dentro_5min,
        COUNT(*) FILTER (WHERE fb.minutes <= 15)::int AS dentro_15min,
        COUNT(*) FILTER (WHERE fb.minutes <= 60)::int AS dentro_60min,
        CASE WHEN t.total > 0 THEN ROUND((COUNT(*) FILTER (WHERE fb.minutes <= 5) / t.total)::numeric, 4) ELSE 0 END AS pct_5min,
        CASE WHEN t.total > 0 THEN ROUND((COUNT(*) FILTER (WHERE fb.minutes <= 15) / t.total)::numeric, 4) ELSE 0 END AS pct_15min,
        CASE WHEN t.total > 0 THEN ROUND((COUNT(*) FILTER (WHERE fb.minutes <= 60) / t.total)::numeric, 4) ELSE 0 END AS pct_60min
      FROM first_bid fb, total t
      GROUP BY t.total
    `, [from, to]);

    // 4) Buckets: % consultas aceitas em até X minutos
    const bucketsAcceptResult = await pool.query(`
      WITH first_accept AS (
        SELECT
          c.id AS consultation_id,
          EXTRACT(EPOCH FROM (MIN(b.created_at) - c.created_at)) / 60.0 AS minutes
        FROM consultations c
        JOIN bids b ON b.consultation_id = c.id
        JOIN doctors d ON d.id = b.doctor_id
        WHERE c.is_marketplace = true
          AND c.created_at >= $1 AND c.created_at < $2
          AND b.is_accepted = true
          ${verifiedFilter}
        GROUP BY c.id
      ),
      total AS (
        SELECT COUNT(*)::float AS total FROM consultations c
        WHERE c.is_marketplace = true
          AND c.created_at >= $1 AND c.created_at < $2
      )
      SELECT
        t.total AS total_consultas,
        COUNT(*) FILTER (WHERE fa.minutes <= 15)::int AS aceito_15min,
        COUNT(*) FILTER (WHERE fa.minutes <= 60)::int AS aceito_60min,
        COUNT(*) FILTER (WHERE fa.minutes <= 1440)::int AS aceito_24h,
        CASE WHEN t.total > 0 THEN ROUND((COUNT(*) FILTER (WHERE fa.minutes <= 15) / t.total)::numeric, 4) ELSE 0 END AS pct_15min,
        CASE WHEN t.total > 0 THEN ROUND((COUNT(*) FILTER (WHERE fa.minutes <= 60) / t.total)::numeric, 4) ELSE 0 END AS pct_60min,
        CASE WHEN t.total > 0 THEN ROUND((COUNT(*) FILTER (WHERE fa.minutes <= 1440) / t.total)::numeric, 4) ELSE 0 END AS pct_24h
      FROM first_accept fa, total t
      GROUP BY t.total
    `, [from, to]);

    // 5) Conversão por status
    const conversionResult = await pool.query(`
      SELECT
        status,
        COUNT(*)::int AS total
      FROM consultations
      WHERE is_marketplace = true
        AND created_at >= $1 AND created_at < $2
      GROUP BY status
      ORDER BY total DESC
    `, [from, to]);

    const tb = timingBidResult.rows[0] ?? {};
    const ta = timingAcceptResult.rows[0] ?? {};
    const bb = bucketsBidResult.rows[0] ?? {};
    const ba = bucketsAcceptResult.rows[0] ?? {};

    const result = {
      ok: true,
      range: { days, from: from.toISOString(), to: to.toISOString() },
      verifiedOnly,
      timing: {
        toFirstBid: {
          avg: Math.round((tb.avg ?? 0) * 10) / 10,
          p50: Math.round((tb.p50 ?? 0) * 10) / 10,
          p90: Math.round((tb.p90 ?? 0) * 10) / 10,
          p95: Math.round((tb.p95 ?? 0) * 10) / 10,
        },
        toAccept: {
          avg: Math.round((ta.avg ?? 0) * 10) / 10,
          p50: Math.round((ta.p50 ?? 0) * 10) / 10,
          p90: Math.round((ta.p90 ?? 0) * 10) / 10,
          p95: Math.round((ta.p95 ?? 0) * 10) / 10,
        },
      },
      buckets: {
        bidWithin: {
          "5min": { count: bb.dentro_5min ?? 0, pct: Number(bb.pct_5min ?? 0) },
          "15min": { count: bb.dentro_15min ?? 0, pct: Number(bb.pct_15min ?? 0) },
          "60min": { count: bb.dentro_60min ?? 0, pct: Number(bb.pct_60min ?? 0) },
        },
        acceptedWithin: {
          "15min": { count: ba.aceito_15min ?? 0, pct: Number(ba.pct_15min ?? 0) },
          "60min": { count: ba.aceito_60min ?? 0, pct: Number(ba.pct_60min ?? 0) },
          "24h": { count: ba.aceito_24h ?? 0, pct: Number(ba.pct_24h ?? 0) },
        },
      },
      conversion: conversionResult.rows.reduce((acc, r) => {
        acc[r.status || "unknown"] = r.total;
        return acc;
      }, {}),
    };

    setCache(cacheKey, result);
    return res.json(result);
  } catch (err) {
    console.error("[manager-marketplace-sla] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao gerar SLA" });
  }
});

// ============================================
// POST /cron/unsigned-alerts - Automação de alertas para pendências críticas
// Body: { days?: 30 }
// ============================================
router.post("/metrics/v2/cron/unsigned-alerts", requireInternalToken, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.body?.days ?? 30)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Buscar médicos com pendências críticas (>= 240 min)
    const criticalResult = await pool.query(`
      SELECT
        pc.medico_id,
        u.full_name AS medico_nome,
        u.email AS medico_email,
        COUNT(*) FILTER (
          WHERE pc.finalized_at IS NOT NULL
            AND pc.signed_at IS NULL
            AND (pc.ia_metadata->>'assinatura' IS NULL OR pc.ia_metadata->>'assinatura' = '')
            AND EXTRACT(EPOCH FROM (NOW() - pc.finalized_at)) / 60 >= 240
        )::int AS criticos
      FROM prontuarios_consulta pc
      LEFT JOIN users u ON u.id::text = pc.medico_id
      WHERE pc.created_at >= $1
      GROUP BY pc.medico_id, u.full_name, u.email
      HAVING COUNT(*) FILTER (
        WHERE pc.finalized_at IS NOT NULL
          AND pc.signed_at IS NULL
          AND (pc.ia_metadata->>'assinatura' IS NULL OR pc.ia_metadata->>'assinatura' = '')
          AND EXTRACT(EPOCH FROM (NOW() - pc.finalized_at)) / 60 >= 240
      ) > 0
    `, [since]);

    const medicosCriticos = criticalResult.rows;
    let created = 0;

    for (const m of medicosCriticos) {
      // Verificar se já foi notificado nas últimas 24h
      const recentCheck = await pool.query(`
        SELECT id FROM manager_notifications
        WHERE medico_id = $1
          AND kind = 'unsigned_prontuario_auto'
          AND created_at >= $2
        LIMIT 1
      `, [m.medico_id, last24h]);

      if (recentCheck.rows.length > 0) continue;

      // Criar notificação automática
      await pool.query(`
        INSERT INTO manager_notifications (manager_user_id, medico_id, prontuario_id, kind, payload)
        VALUES (NULL, $1, NULL, 'unsigned_prontuario_auto', $2)
      `, [
        m.medico_id,
        JSON.stringify({
          days,
          criticos: m.criticos,
          medicoNome: m.medico_nome,
          medicoEmail: m.medico_email,
          reason: "Pendências críticas (>= 4h) detectadas automaticamente",
          generatedAt: new Date().toISOString(),
        }),
      ]);

      created++;
    }

    console.log(`[cron/unsigned-alerts] encontrados=${medicosCriticos.length}, criados=${created}`);

    return res.json({
      ok: true,
      days,
      encontrados: medicosCriticos.length,
      notificacoesCriadas: created,
    });
  } catch (err) {
    console.error("[cron/unsigned-alerts] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao processar alertas" });
  }
});

// ============================================
// GET /notifications - Listar notificações recentes
// Query params: ?kind=unsigned_prontuario_auto&days=7&limit=50
// ============================================
router.get("/metrics/v2/notifications", requireManager, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days ?? 7)));
    const limit = Math.max(1, Math.min(200, Number(req.query.limit ?? 50)));
    const kind = req.query.kind || null;
    
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let query = `
      SELECT
        mn.id,
        mn.created_at,
        mn.manager_user_id,
        mn.medico_id,
        mn.prontuario_id,
        mn.kind,
        mn.payload,
        u.full_name AS medico_nome
      FROM manager_notifications mn
      LEFT JOIN users u ON u.id::text = mn.medico_id
      WHERE mn.created_at >= $1
    `;
    const params = [since];

    if (kind) {
      query += ` AND mn.kind = $${params.length + 1}`;
      params.push(kind);
    }

    query += ` ORDER BY mn.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    return res.json({
      ok: true,
      days,
      kind: kind || "all",
      total: result.rows.length,
      notifications: result.rows.map(r => ({
        id: r.id,
        createdAt: r.created_at,
        managerUserId: r.manager_user_id,
        medicoId: r.medico_id,
        medicoNome: r.medico_nome || "Desconhecido",
        prontuarioId: r.prontuario_id,
        kind: r.kind,
        payload: r.payload,
      })),
    });
  } catch (err) {
    console.error("[notifications] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao listar notificações" });
  }
});

export default router;
