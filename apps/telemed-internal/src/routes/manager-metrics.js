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
// Query params: ?days=30&limit=200&offset=0&medico_id=...&minHours=0
// ============================================
router.get("/metrics/v2/pending/unsigned", requireManager, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days ?? 30)));
    const limit = Math.max(1, Math.min(500, Number(req.query.limit ?? 200)));
    const offset = Math.max(0, Number(req.query.offset ?? 0));
    const medicoId = req.query.medico_id ? String(req.query.medico_id) : null;
    const minHours = Math.max(0, Number(req.query.minHours ?? 0));

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
    
    // Filtro por idade mínima (SLA drill-down) - usa finalized_at para consistência com tempo_parado_min
    if (minHours > 0) {
      query += ` AND EXTRACT(EPOCH FROM (NOW() - p.finalized_at)) / 3600 >= $${params.length + 1}`;
      params.push(minHours);
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
      countQuery += ` AND p.medico_id = $${countParams.length + 1}`;
      countParams.push(medicoId);
    }
    
    // Filtro por idade mínima (SLA drill-down) - count - usa finalized_at para consistência
    if (minHours > 0) {
      countQuery += ` AND EXTRACT(EPOCH FROM (NOW() - p.finalized_at)) / 3600 >= $${countParams.length + 1}`;
      countParams.push(minHours);
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
// GET /manager-marketplace-funnel - Funil por status + conversão
// Query params: ?days=90&verifiedOnly=0
// ============================================
router.get("/manager-marketplace-funnel", requireManager, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days ?? 90)));
    const verifiedOnly = req.query.verifiedOnly === "1" || req.query.verifiedOnly === "true";
    
    const cacheKey = `marketplace-funnel:${days}:${verifiedOnly}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);
    
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);

    // Filtro para consultas com bids de médicos verificados
    const verifiedFilter = verifiedOnly 
      ? `AND EXISTS (
           SELECT 1 FROM bids b
           JOIN doctors d ON d.id = b.doctor_id
           WHERE b.consultation_id = c.id
             AND d.is_verified = true
         )` 
      : "";

    // Contagem por status
    const statusResult = await pool.query(`
      SELECT
        status::text AS status,
        COUNT(*)::int AS count
      FROM consultations c
      WHERE c.is_marketplace = true
        AND c.created_at >= $1 AND c.created_at < $2
        ${verifiedFilter}
      GROUP BY status
      ORDER BY count DESC
    `, [from, to]);

    // Total criadas
    const totalResult = await pool.query(`
      SELECT COUNT(*)::int AS created
      FROM consultations c
      WHERE c.is_marketplace = true
        AND c.created_at >= $1 AND c.created_at < $2
        ${verifiedFilter}
    `, [from, to]);

    const created = Number(totalResult.rows[0]?.created ?? 0);

    // Normalizar status
    const bucket = {
      pending: 0,
      doctor_matched: 0,
      scheduled: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const r of statusResult.rows) {
      if (r.status in bucket) bucket[r.status] = r.count;
    }

    const rates = {
      matchRate: created > 0 ? Math.round((bucket.doctor_matched / created) * 10000) / 10000 : 0,
      scheduleRate: created > 0 ? Math.round((bucket.scheduled / created) * 10000) / 10000 : 0,
      inProgressRate: created > 0 ? Math.round((bucket.in_progress / created) * 10000) / 10000 : 0,
      completionRate: created > 0 ? Math.round((bucket.completed / created) * 10000) / 10000 : 0,
      cancelRate: created > 0 ? Math.round((bucket.cancelled / created) * 10000) / 10000 : 0,
    };

    const result = {
      ok: true,
      range: { days, from: from.toISOString(), to: to.toISOString() },
      filters: { verifiedOnly },
      created,
      status: bucket,
      rates,
    };

    setCache(cacheKey, result);
    return res.json(result);
  } catch (err) {
    console.error("[manager-marketplace-funnel] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao gerar funil" });
  }
});

// ============================================
// GET /manager-marketplace-health - Saúde do leilão (competitividade)
// Query params: ?days=90&verifiedOnly=0
// ============================================
router.get("/manager-marketplace-health", requireManager, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days ?? 90)));
    const verifiedOnly = req.query.verifiedOnly === "1" || req.query.verifiedOnly === "true";
    
    const cacheKey = `marketplace-health:${days}:${verifiedOnly}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);
    
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);

    const verifiedFilter = verifiedOnly 
      ? "AND d.is_verified = true AND d.is_active = true" 
      : "";

    // 1) Bids por consulta (média, p50, p90)
    const bidsPerConsultResult = await pool.query(`
      WITH bid_counts AS (
        SELECT
          c.id AS consultation_id,
          COUNT(b.id)::int AS bid_count
        FROM consultations c
        LEFT JOIN bids b ON b.consultation_id = c.id
        ${verifiedOnly ? "LEFT JOIN doctors d ON d.id = b.doctor_id" : ""}
        WHERE c.is_marketplace = true
          AND c.created_at >= $1 AND c.created_at < $2
          ${verifiedFilter}
        GROUP BY c.id
      )
      SELECT
        COALESCE(AVG(bid_count), 0)::float AS avg,
        COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY bid_count), 0)::float AS p50,
        COALESCE(percentile_cont(0.9) WITHIN GROUP (ORDER BY bid_count), 0)::float AS p90,
        COUNT(*) FILTER (WHERE bid_count = 0)::int AS sem_bids,
        COUNT(*)::int AS total_consultas
      FROM bid_counts
    `, [from, to]);

    // 2) Concentração por médico (top 1/3/5 respondem quantos % dos bids)
    const concentrationResult = await pool.query(`
      WITH doc_bids AS (
        SELECT
          b.doctor_id,
          COUNT(*)::int AS bids
        FROM bids b
        JOIN consultations c ON c.id = b.consultation_id
        ${verifiedOnly ? "JOIN doctors d ON d.id = b.doctor_id" : ""}
        WHERE c.is_marketplace = true
          AND c.created_at >= $1 AND c.created_at < $2
          ${verifiedFilter}
        GROUP BY b.doctor_id
        ORDER BY bids DESC
      ),
      total AS (
        SELECT SUM(bids)::float AS total_bids FROM doc_bids
      ),
      ranked AS (
        SELECT bids, ROW_NUMBER() OVER (ORDER BY bids DESC) AS rank
        FROM doc_bids
      )
      SELECT
        t.total_bids,
        COALESCE(SUM(r.bids) FILTER (WHERE r.rank <= 1), 0)::int AS top1_bids,
        COALESCE(SUM(r.bids) FILTER (WHERE r.rank <= 3), 0)::int AS top3_bids,
        COALESCE(SUM(r.bids) FILTER (WHERE r.rank <= 5), 0)::int AS top5_bids,
        CASE WHEN t.total_bids > 0 THEN ROUND((SUM(r.bids) FILTER (WHERE r.rank <= 1) / t.total_bids)::numeric, 4) ELSE 0 END AS top1_pct,
        CASE WHEN t.total_bids > 0 THEN ROUND((SUM(r.bids) FILTER (WHERE r.rank <= 3) / t.total_bids)::numeric, 4) ELSE 0 END AS top3_pct,
        CASE WHEN t.total_bids > 0 THEN ROUND((SUM(r.bids) FILTER (WHERE r.rank <= 5) / t.total_bids)::numeric, 4) ELSE 0 END AS top5_pct
      FROM ranked r, total t
      GROUP BY t.total_bids
    `, [from, to]);

    // 3) Tempo de cauda: consultas sem bids após 15/60 min
    const tailResult = await pool.query(`
      WITH consult_status AS (
        SELECT
          c.id,
          c.created_at,
          MIN(b.created_at) AS first_bid_at,
          EXTRACT(EPOCH FROM (NOW() - c.created_at)) / 60.0 AS age_min
        FROM consultations c
        LEFT JOIN bids b ON b.consultation_id = c.id
        WHERE c.is_marketplace = true
          AND c.created_at >= $1 AND c.created_at < $2
        GROUP BY c.id
      )
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE first_bid_at IS NULL AND age_min >= 15)::int AS sem_bid_15min,
        COUNT(*) FILTER (WHERE first_bid_at IS NULL AND age_min >= 60)::int AS sem_bid_60min,
        COUNT(*) FILTER (WHERE first_bid_at IS NULL AND age_min >= 1440)::int AS sem_bid_24h
      FROM consult_status
    `, [from, to]);

    const bc = bidsPerConsultResult.rows[0] ?? {};
    const cc = concentrationResult.rows[0] ?? {};
    const tc = tailResult.rows[0] ?? {};

    const result = {
      ok: true,
      range: { days, from: from.toISOString(), to: to.toISOString() },
      filters: { verifiedOnly },
      bidsPerConsultation: {
        avg: Math.round((bc.avg ?? 0) * 100) / 100,
        p50: Math.round((bc.p50 ?? 0) * 10) / 10,
        p90: Math.round((bc.p90 ?? 0) * 10) / 10,
        semBids: bc.sem_bids ?? 0,
        totalConsultas: bc.total_consultas ?? 0,
      },
      concentration: {
        totalBids: Number(cc.total_bids ?? 0),
        top1: { bids: cc.top1_bids ?? 0, pct: Number(cc.top1_pct ?? 0) },
        top3: { bids: cc.top3_bids ?? 0, pct: Number(cc.top3_pct ?? 0) },
        top5: { bids: cc.top5_bids ?? 0, pct: Number(cc.top5_pct ?? 0) },
      },
      tail: {
        total: tc.total ?? 0,
        semBidApos15min: tc.sem_bid_15min ?? 0,
        semBidApos60min: tc.sem_bid_60min ?? 0,
        semBidApos24h: tc.sem_bid_24h ?? 0,
      },
    };

    setCache(cacheKey, result);
    return res.json(result);
  } catch (err) {
    console.error("[manager-marketplace-health] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao gerar saúde" });
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

    // Heartbeat: registra execução do cron (mesmo sem alertas)
    await pool.query(`
      INSERT INTO manager_notifications (manager_user_id, medico_id, prontuario_id, kind, payload)
      VALUES (NULL, NULL, NULL, 'cron_unsigned_alerts_run', $1)
    `, [
      JSON.stringify({
        days,
        ok: true,
        encontrados: medicosCriticos.length,
        notificacoesCriadas: created,
        ranAt: new Date().toISOString(),
      }),
    ]);

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

// ============================================
// GET /quality/missing-fields - Prontuários finalizados com campos críticos faltantes
// Query params: ?days=30&limit=100&offset=0&medico_id=...
// ============================================
router.get("/metrics/v2/quality/missing-fields", requireManager, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days ?? 30)));
    const limit = Math.max(1, Math.min(500, Number(req.query.limit ?? 100)));
    const offset = Math.max(0, Number(req.query.offset ?? 0));
    const medicoId = req.query.medico_id || null;

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Campos críticos no prontuário: queixa_principal, anamnese, hipoteses_cid (array de CIDs)
    let baseQuery = `
      WITH problematicos AS (
        SELECT
          pc.id AS prontuario_id,
          pc.medico_id,
          pc.consulta_id,
          pc.finalized_at,
          pc.created_at,
          array_remove(ARRAY[
            CASE WHEN pc.queixa_principal IS NULL OR pc.queixa_principal = '' THEN 'queixa_principal' ELSE NULL END,
            CASE WHEN pc.anamnese IS NULL OR pc.anamnese = '' THEN 'anamnese' ELSE NULL END,
            CASE WHEN pc.hipoteses_cid = '[]'::jsonb THEN 'hipoteses_cid' ELSE NULL END
          ], NULL) AS faltando,
          u.full_name AS medico_nome,
          u.email AS medico_email
        FROM prontuarios_consulta pc
        LEFT JOIN users u ON u.id::text = pc.medico_id
        WHERE pc.created_at >= $1
          AND pc.finalized_at IS NOT NULL
          AND (
            pc.queixa_principal IS NULL OR pc.queixa_principal = '' OR
            pc.anamnese IS NULL OR pc.anamnese = '' OR
            pc.hipoteses_cid = '[]'::jsonb
          )
    `;

    const params = [since];
    
    if (medicoId) {
      params.push(medicoId);
      baseQuery += ` AND pc.medico_id = $${params.length}`;
    }

    baseQuery += `)
      SELECT * FROM problematicos
      ORDER BY finalized_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);

    const result = await pool.query(baseQuery, params);

    // Contagem total
    let countQuery = `
      SELECT COUNT(*)::int AS total
      FROM prontuarios_consulta pc
      WHERE pc.created_at >= $1
        AND pc.finalized_at IS NOT NULL
        AND (
          pc.queixa_principal IS NULL OR pc.queixa_principal = '' OR
          pc.anamnese IS NULL OR pc.anamnese = '' OR
          pc.hipoteses_cid = '[]'::jsonb
        )
    `;
    const countParams = [since];
    
    if (medicoId) {
      countParams.push(medicoId);
      countQuery += ` AND pc.medico_id = $${countParams.length}`;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = countResult.rows[0]?.total ?? 0;

    return res.json({
      ok: true,
      range: { days, since: since.toISOString() },
      filters: { medico_id: medicoId },
      paging: { limit, offset, total },
      items: result.rows.map(r => ({
        prontuarioId: r.prontuario_id,
        medicoId: r.medico_id,
        medicoNome: r.medico_nome || "—",
        medicoEmail: r.medico_email,
        consultaId: r.consulta_id,
        finalizedAt: r.finalized_at,
        createdAt: r.created_at,
        faltando: r.faltando,
        prontuarioLink: `/consultorio/prontuario/${r.prontuario_id}`,
      })),
    });
  } catch (err) {
    console.error("[quality/missing-fields] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao listar qualidade" });
  }
});

// ============================================
// C2: GET /manager-revenue - Financeiro: GMV, receita plataforma, repasse médico
// Query params: ?days=90&marketplaceOnly=1&verifiedOnly=1
// ============================================
router.get("/manager-revenue", requireManager, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days ?? 30)));
    const marketplaceOnly = req.query.marketplaceOnly === "1" || req.query.marketplaceOnly === "true";
    const verifiedOnly = req.query.verifiedOnly === "1" || req.query.verifiedOnly === "true";

    const cacheKey = `revenue:${days}:m${marketplaceOnly ? 1 : 0}:v${verifiedOnly ? 1 : 0}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.at < TTL) {
      return res.json(cached.data);
    }

    const to = new Date();
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Construir WHERE dinâmico
    let whereClause = `c.created_at >= $1 AND c.created_at < $2`;
    const params = [from, to];

    if (marketplaceOnly) {
      whereClause += ` AND c.is_marketplace = true`;
    }
    if (verifiedOnly) {
      whereClause += ` AND EXISTS (SELECT 1 FROM doctors d WHERE d.id = c.doctor_id AND d.is_verified = true)`;
    }

    // 1) Totais financeiros
    const totalsQuery = `
      SELECT
        COALESCE(SUM(COALESCE(c.agreed_price::numeric, c.patient_offer::numeric)), 0)::numeric AS gmv,
        COALESCE(SUM(c.platform_fee::numeric), 0)::numeric AS platform_revenue,
        COALESCE(SUM(c.doctor_earnings::numeric), 0)::numeric AS doctor_payout,
        COUNT(*)::int AS consultations,
        COUNT(*) FILTER (WHERE COALESCE(c.agreed_price, c.patient_offer) IS NOT NULL)::int AS priced_count,
        COUNT(*) FILTER (WHERE c.status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE c.status = 'doctor_matched')::int AS doctor_matched,
        COUNT(*) FILTER (WHERE c.status = 'scheduled')::int AS scheduled,
        COUNT(*) FILTER (WHERE c.status = 'in_progress')::int AS in_progress,
        COUNT(*) FILTER (WHERE c.status = 'completed')::int AS completed,
        COUNT(*) FILTER (WHERE c.status = 'cancelled')::int AS cancelled
      FROM consultations c
      WHERE ${whereClause}
    `;
    const totalsResult = await pool.query(totalsQuery, params);
    const totals = totalsResult.rows[0] || {};

    // 2) Por canal (marketplace vs direto)
    const byChannelQuery = `
      SELECT
        CASE WHEN c.is_marketplace THEN 'marketplace' ELSE 'direct' END AS channel,
        COALESCE(SUM(COALESCE(c.agreed_price::numeric, c.patient_offer::numeric)), 0)::numeric AS gmv,
        COALESCE(SUM(c.platform_fee::numeric), 0)::numeric AS platform_revenue,
        COALESCE(SUM(c.doctor_earnings::numeric), 0)::numeric AS doctor_payout,
        COUNT(*)::int AS consultations
      FROM consultations c
      WHERE ${whereClause}
      GROUP BY 1
      ORDER BY 1
    `;
    const byChannelResult = await pool.query(byChannelQuery, params);

    // 3) Por tipo de consulta
    const byTypeQuery = `
      SELECT
        c.consultation_type::text AS consultation_type,
        COALESCE(SUM(COALESCE(c.agreed_price::numeric, c.patient_offer::numeric)), 0)::numeric AS gmv,
        COALESCE(SUM(c.platform_fee::numeric), 0)::numeric AS platform_revenue,
        COALESCE(SUM(c.doctor_earnings::numeric), 0)::numeric AS doctor_payout,
        COUNT(*)::int AS consultations
      FROM consultations c
      WHERE ${whereClause}
      GROUP BY 1
      ORDER BY gmv DESC
    `;
    const byTypeResult = await pool.query(byTypeQuery, params);

    // 4) Top médicos por receita
    const topDoctorsQuery = `
      SELECT
        c.doctor_id,
        u.full_name AS doctor_name,
        COALESCE(SUM(COALESCE(c.agreed_price::numeric, c.patient_offer::numeric)), 0)::numeric AS gmv,
        COALESCE(SUM(c.platform_fee::numeric), 0)::numeric AS platform_revenue,
        COALESCE(SUM(c.doctor_earnings::numeric), 0)::numeric AS doctor_payout,
        COUNT(*)::int AS consultations
      FROM consultations c
      JOIN doctors d ON d.id = c.doctor_id
      JOIN users u ON u.id = d.user_id
      WHERE ${whereClause}
        AND c.doctor_id IS NOT NULL
      GROUP BY c.doctor_id, u.full_name
      ORDER BY gmv DESC
      LIMIT 20
    `;
    const topDoctorsResult = await pool.query(topDoctorsQuery, params);

    const gmv = Number(totals.gmv ?? 0);
    const pricedCount = Number(totals.priced_count ?? 0);

    const result = {
      ok: true,
      range: { days, from: from.toISOString(), to: to.toISOString() },
      filters: { marketplaceOnly, verifiedOnly },
      totals: {
        gmv,
        platformRevenue: Number(totals.platform_revenue ?? 0),
        doctorPayout: Number(totals.doctor_payout ?? 0),
        consultations: Number(totals.consultations ?? 0),
        pricedCount,
        avgTicket: pricedCount ? gmv / pricedCount : 0,
        statusCounts: {
          pending: Number(totals.pending ?? 0),
          doctorMatched: Number(totals.doctor_matched ?? 0),
          scheduled: Number(totals.scheduled ?? 0),
          inProgress: Number(totals.in_progress ?? 0),
          completed: Number(totals.completed ?? 0),
          cancelled: Number(totals.cancelled ?? 0),
        },
      },
      byChannel: byChannelResult.rows.map(r => ({
        channel: r.channel,
        gmv: Number(r.gmv),
        platformRevenue: Number(r.platform_revenue),
        doctorPayout: Number(r.doctor_payout),
        consultations: Number(r.consultations),
      })),
      byType: byTypeResult.rows.map(r => ({
        consultationType: r.consultation_type,
        gmv: Number(r.gmv),
        platformRevenue: Number(r.platform_revenue),
        doctorPayout: Number(r.doctor_payout),
        consultations: Number(r.consultations),
      })),
      topDoctors: topDoctorsResult.rows.map(r => ({
        doctorId: r.doctor_id,
        doctorName: r.doctor_name,
        gmv: Number(r.gmv),
        platformRevenue: Number(r.platform_revenue),
        doctorPayout: Number(r.doctor_payout),
        consultations: Number(r.consultations),
      })),
    };

    cache.set(cacheKey, { at: Date.now(), data: result });
    return res.json(result);
  } catch (err) {
    console.error("[manager-revenue] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao calcular receita" });
  }
});

// ============================================
// C1 - RECEITA × OPERAÇÃO: agregado por faixa de preço
// ============================================
router.get("/revenue/operation", requireManager, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days ?? 30)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const finalizeSlaMin = 30;
    const signSlaMin = 60;

    const { rows } = await pool.query(`
      WITH priced AS (
        SELECT 
          p.id,
          p.finalized_at,
          p.signed_at,
          p.created_at,
          p.queixa_principal,
          p.anamnese,
          p.hipoteses_cid,
          COALESCE(c.agreed_price::numeric, c.patient_offer::numeric, 0) AS price
        FROM prontuarios_consulta p
        LEFT JOIN consultations c ON 
          c.id = CASE 
            WHEN p.consulta_id ~ '^[0-9]+$' THEN p.consulta_id::int 
            ELSE NULL 
          END
        WHERE p.created_at >= $1
      )
      SELECT 
        CASE
          WHEN price < 100 THEN '<100'
          WHEN price < 150 THEN '100-149'
          WHEN price < 200 THEN '150-199'
          ELSE '200+'
        END AS bucket,
        COUNT(*)::int AS consultas,
        SUM(price)::float AS gmv,
        AVG(price)::float AS ticket_medio,
        
        AVG(
          CASE WHEN finalized_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (finalized_at - created_at)) / 60
          ELSE NULL END
        ) AS tempo_medio_finalizar_min,
        
        AVG(
          CASE WHEN signed_at IS NOT NULL AND finalized_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (signed_at - finalized_at)) / 60
          ELSE NULL END
        ) AS tempo_medio_assinar_min,
        
        COUNT(finalized_at)::int AS finalizados,
        SUM(
          CASE
            WHEN finalized_at IS NOT NULL
             AND EXTRACT(EPOCH FROM (finalized_at - created_at)) / 60 <= $2
            THEN 1 ELSE 0 END
        )::int AS finalizados_dentro_sla,
        
        COUNT(signed_at)::int AS assinados,
        SUM(
          CASE
            WHEN signed_at IS NOT NULL AND finalized_at IS NOT NULL
             AND EXTRACT(EPOCH FROM (signed_at - finalized_at)) / 60 <= $3
            THEN 1 ELSE 0 END
        )::int AS assinados_dentro_sla,
        
        SUM(
          CASE
            WHEN finalized_at IS NOT NULL
             AND (
               queixa_principal IS NULL OR queixa_principal = ''
               OR anamnese IS NULL OR anamnese = ''
               OR hipoteses_cid IS NULL OR hipoteses_cid = '[]'::jsonb
             )
            THEN 1 ELSE 0 END
        )::int AS campos_criticos_faltantes
        
      FROM priced
      WHERE price > 0
      GROUP BY bucket
      ORDER BY bucket
    `, [since.toISOString(), finalizeSlaMin, signSlaMin]);

    const buckets = rows.map((r) => ({
      bucket: r.bucket,
      consultas: r.consultas,
      gmv: Number(r.gmv) || 0,
      ticketMedio: Number(r.ticket_medio) || 0,
      tempoMedioFinalizarMin: r.tempo_medio_finalizar_min ? Number(r.tempo_medio_finalizar_min) : null,
      tempoMedioAssinarMin: r.tempo_medio_assinar_min ? Number(r.tempo_medio_assinar_min) : null,
      pctFinalizadosDentroSla: r.finalizados > 0 ? r.finalizados_dentro_sla / r.finalizados : 0,
      pctAssinadosDentroSla: r.assinados > 0 ? r.assinados_dentro_sla / r.assinados : 0,
      pctCamposCriticosFaltantes: r.finalizados > 0 ? r.campos_criticos_faltantes / r.finalizados : 0,
    }));

    return res.json({
      ok: true,
      range: { days, since: since.toISOString() },
      sla: { finalizeSlaMin, signSlaMin },
      buckets,
    });
  } catch (err) {
    console.error("[revenue/operation] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao gerar dados" });
  }
});

// ============================================
// C2.2 - BACKFILL: consultas direct antigas sem fees
// ============================================
function calcFees(agreed) {
  const feeRate = 0.2;
  const platformFee = Math.round(agreed * feeRate * 100) / 100;
  const doctorEarnings = Math.round((agreed - platformFee) * 100) / 100;
  return { platformFee, doctorEarnings };
}

router.post("/backfill/direct-fees", requireManager, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(`
      SELECT id, agreed_price
      FROM consultations
      WHERE is_marketplace = false
        AND agreed_price IS NOT NULL
        AND platform_fee IS NULL
      FOR UPDATE
    `);

    let updated = 0;

    for (const c of rows) {
      const agreed = Number(c.agreed_price);
      if (!agreed || agreed <= 0) continue;

      const { platformFee, doctorEarnings } = calcFees(agreed);

      await client.query(
        `
        UPDATE consultations
        SET platform_fee = $1,
            doctor_earnings = $2,
            updated_at = NOW()
        WHERE id = $3
        `,
        [platformFee, doctorEarnings, c.id]
      );

      updated++;
    }

    await client.query("COMMIT");

    return res.json({
      ok: true,
      updated,
      message: `${updated} consultas direct atualizadas com fees`
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("backfill direct-fees error", err);
    return res.status(500).json({ ok: false, error: "Erro interno" });
  } finally {
    client.release();
  }
});

// ============================================
// B2.1 - HEATMAP: created/finalized/signed por dia x hora
// ============================================
router.get("/heatmap", requireManager, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days ?? 30)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { rows } = await pool.query(`
      SELECT 
        EXTRACT(DOW FROM created_at) AS dow,
        EXTRACT(HOUR FROM created_at) AS hour,
        COUNT(*) AS created,
        COUNT(*) FILTER (WHERE finalized_at IS NOT NULL) AS finalized,
        COUNT(*) FILTER (WHERE signed_at IS NOT NULL) AS signed
      FROM prontuarios_consulta
      WHERE created_at >= $1
      GROUP BY dow, hour
      ORDER BY dow, hour
    `, [since.toISOString()]);

    const matrix = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({ created: 0, finalized: 0, signed: 0, backlog: 0 }))
    );

    for (const r of rows) {
      const dow = Number(r.dow);
      const hour = Number(r.hour);
      const created = Number(r.created || 0);
      const finalized = Number(r.finalized || 0);
      const signed = Number(r.signed || 0);
      matrix[dow][hour] = {
        created,
        finalized,
        signed,
        backlog: created - signed,
      };
    }

    return res.json({
      ok: true,
      range: { days, since: since.toISOString() },
      matrix,
      dayLabels: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
    });
  } catch (err) {
    console.error("[heatmap] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao gerar heatmap" });
  }
});

// ============================================
// 1) BUSCA GLOBAL - pacientes, médicos, prontuários
// GET /search?q=...&from=YYYY-MM-DD&to=YYYY-MM-DD&status=...&limit=20
// ============================================
router.get("/search", requireManager, async (req, res) => {
  const start = Date.now();
  try {
    const { q = "", from, to, status, limit: limitStr } = req.query;
    const limitNum = Math.max(1, Math.min(50, Number(limitStr ?? 20)));
    
    if (!q || q.trim().length < 2) {
      return res.json({
        ok: true,
        q,
        tookMs: Date.now() - start,
        groups: { prontuarios: [], pacientes: [], medicos: [] }
      });
    }
    
    const search = q.trim();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search);
    const normalizedPhone = search.replace(/[\s()\-+]/g, "").replace(/^55/, "");
    
    let prontuarios = [];
    let pacientes = [];
    let medicos = [];
    
    // Se parece UUID, buscar prontuário direto (short-circuit, não busca pacientes/médicos)
    if (isUUID) {
      const { rows } = await pool.query(`
        SELECT 
          p.id, p.status, p.created_at, p.finalized_at, p.signed_at,
          p.paciente_id, p.medico_id, p.queixa_principal
        FROM prontuarios_consulta p
        WHERE p.id = $1
        LIMIT 1
      `, [search]);
      prontuarios = rows.map(r => ({
        id: r.id,
        status: r.status,
        createdAt: r.created_at,
        finalizedAt: r.finalized_at,
        signedAt: r.signed_at,
        pacienteId: r.paciente_id,
        medicoId: r.medico_id,
        queixaPrincipal: r.queixa_principal?.substring(0, 100)
      }));
      
      // Short-circuit: para UUID retornamos direto sem buscar pacientes/médicos
      return res.json({
        ok: true,
        q,
        tookMs: Date.now() - start,
        groups: { prontuarios, pacientes: [], medicos: [] }
      });
    }
    
    // Busca textual (nome, email, telefone)
    {
      // Buscar pacientes por nome, email, telefone (usa phone_normalized para performance)
      const patQ = await pool.query(`
        SELECT 
          u.id, u.full_name AS nome, u.email, u.phone AS telefone
        FROM users u
        INNER JOIN patients pt ON pt.user_id = u.id
        WHERE 
          u.full_name ILIKE $1
          OR u.email ILIKE $1
          OR u.phone_normalized LIKE $2
        ORDER BY u.full_name
        LIMIT $3
      `, [`%${search}%`, `%${normalizedPhone}%`, limitNum]);
      pacientes = patQ.rows.map(r => ({
        id: r.id,
        nome: r.nome,
        email: r.email,
        telefone: r.telefone
      }));
      
      // Buscar médicos por nome, email
      const docQ = await pool.query(`
        SELECT 
          u.id, u.full_name AS nome, u.email, d.crm
        FROM users u
        INNER JOIN doctors d ON d.user_id = u.id
        WHERE 
          u.full_name ILIKE $1
          OR u.email ILIKE $1
        ORDER BY u.full_name
        LIMIT $2
      `, [`%${search}%`, limitNum]);
      medicos = docQ.rows.map(r => ({
        id: r.id,
        nome: r.nome,
        email: r.email,
        crm: r.crm
      }));
      
      // Buscar prontuários por período/status + busca no paciente/médico
      let prontuarioQuery = `
        SELECT 
          p.id, p.status, p.created_at, p.finalized_at, p.signed_at,
          p.paciente_id, p.medico_id, p.queixa_principal
        FROM prontuarios_consulta p
        WHERE 1=1
      `;
      const params = [];
      let idx = 1;
      
      if (from) {
        prontuarioQuery += ` AND p.created_at >= $${idx}`;
        params.push(from);
        idx++;
      }
      if (to) {
        prontuarioQuery += ` AND p.created_at <= $${idx}`;
        params.push(to);
        idx++;
      }
      if (status) {
        prontuarioQuery += ` AND p.status = $${idx}`;
        params.push(status);
        idx++;
      }
      
      // Se tem pacientes/médicos encontrados, buscar prontuários deles
      const patIds = pacientes.map(p => String(p.id));
      const docIds = medicos.map(d => String(d.id));
      
      if (patIds.length > 0 || docIds.length > 0) {
        const conditions = [];
        if (patIds.length > 0) {
          conditions.push(`p.paciente_id = ANY($${idx})`);
          params.push(patIds);
          idx++;
        }
        if (docIds.length > 0) {
          conditions.push(`p.medico_id = ANY($${idx})`);
          params.push(docIds);
          idx++;
        }
        prontuarioQuery += ` AND (${conditions.join(" OR ")})`;
      }
      
      prontuarioQuery += ` ORDER BY p.created_at DESC LIMIT $${idx}`;
      params.push(limitNum);
      
      if (patIds.length > 0 || docIds.length > 0 || from || to || status) {
        const { rows } = await pool.query(prontuarioQuery, params);
        prontuarios = rows.map(r => ({
          id: r.id,
          status: r.status,
          createdAt: r.created_at,
          finalizedAt: r.finalized_at,
          signedAt: r.signed_at,
          pacienteId: r.paciente_id,
          medicoId: r.medico_id,
          queixaPrincipal: r.queixa_principal?.substring(0, 100)
        }));
      }
    }
    
    return res.json({
      ok: true,
      q,
      tookMs: Date.now() - start,
      groups: {
        prontuarios,
        pacientes,
        medicos
      }
    });
  } catch (err) {
    console.error("[search] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro na busca" });
  }
});

// ============================================
// 2) RANKING DE PENDÊNCIAS POR MÉDICO (SLA + backlog)
// GET /doctors/alerts?days=30&criticalHours=48&limit=10
// ============================================
router.get("/doctors/alerts", requireManager, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days ?? 30)));
    const criticalHours = Math.max(1, Math.min(168, Number(req.query.criticalHours ?? 48)));
    const limitNum = Math.max(1, Math.min(50, Number(req.query.limit ?? 10)));
    
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Query agregada por médico
    const { rows } = await pool.query(`
      WITH base AS (
        SELECT
          p.medico_id,
          p.status,
          p.created_at,
          p.updated_at,
          p.signed_at,
          p.finalized_at,
          EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600 AS age_hours_created,
          EXTRACT(EPOCH FROM (NOW() - p.updated_at))/3600 AS age_hours_updated
        FROM prontuarios_consulta p
        WHERE p.created_at >= $1
          AND p.medico_id IS NOT NULL
          AND p.medico_id <> ''
      ),
      agg AS (
        SELECT
          medico_id,
          COUNT(*) FILTER (
            WHERE (status IN ('draft','final') AND signed_at IS NULL)
          )::int AS pendencias_total,
          COUNT(*) FILTER (
            WHERE (status IN ('draft','final') AND signed_at IS NULL AND age_hours_created >= 24)
          )::int AS pendencias_24h,
          COUNT(*) FILTER (
            WHERE (status IN ('draft','final') AND signed_at IS NULL AND age_hours_created >= $2)
          )::int AS criticos
        FROM base
        GROUP BY medico_id
      ),
      trend AS (
        SELECT
          p.medico_id,
          COUNT(*) FILTER (WHERE p.created_at >= NOW() - INTERVAL '7 days')::int AS d7,
          COUNT(*) FILTER (WHERE p.created_at >= NOW() - INTERVAL '30 days')::int AS d30
        FROM prontuarios_consulta p
        WHERE p.created_at >= NOW() - INTERVAL '30 days'
          AND p.status IN ('draft','final') AND p.signed_at IS NULL
          AND p.medico_id IS NOT NULL AND p.medico_id <> ''
        GROUP BY p.medico_id
      )
      SELECT
        a.medico_id,
        COALESCE(u.full_name, 'Médico ' || a.medico_id) AS medico_nome,
        COALESCE(u.email, '') AS medico_email,
        a.pendencias_total,
        a.pendencias_24h,
        a.criticos,
        COALESCE(t.d7, 0) AS d7,
        COALESCE(t.d30, 0) AS d30,
        CASE WHEN COALESCE(t.d30, 0) > 0 
          THEN ROUND(COALESCE(t.d7, 0)::numeric / t.d30::numeric, 2)
          ELSE 0 
        END AS ratio
      FROM agg a
      LEFT JOIN users u ON 
        a.medico_id ~ '^[0-9]+$' AND u.id = a.medico_id::int
      LEFT JOIN trend t ON t.medico_id = a.medico_id
      ORDER BY a.criticos DESC, a.pendencias_24h DESC, a.pendencias_total DESC
    `, [since.toISOString(), criticalHours]);
    
    // Ordenar para os 3 rankings
    const byCritical = [...rows]
      .sort((a, b) => b.criticos - a.criticos || b.pendencias_24h - a.pendencias_24h)
      .slice(0, limitNum);
    
    const by24h = [...rows]
      .sort((a, b) => b.pendencias_24h - a.pendencias_24h || b.criticos - a.criticos)
      .slice(0, limitNum);
    
    const byTotal = [...rows]
      .sort((a, b) => b.pendencias_total - a.pendencias_total || b.criticos - a.criticos)
      .slice(0, limitNum);
    
    return res.json({
      ok: true,
      range: { days, criticalHours },
      top: {
        byCritical: byCritical.map(r => ({
          medicoId: r.medico_id,
          medicoNome: r.medico_nome,
          medicoEmail: r.medico_email,
          criticos: r.criticos,
          pendencias24h: r.pendencias_24h,
          pendenciasTotal: r.pendencias_total,
          trend: { d7: r.d7, d30: r.d30, ratio: parseFloat(r.ratio) || 0 }
        })),
        by24h: by24h.map(r => ({
          medicoId: r.medico_id,
          medicoNome: r.medico_nome,
          medicoEmail: r.medico_email,
          criticos: r.criticos,
          pendencias24h: r.pendencias_24h,
          pendenciasTotal: r.pendencias_total,
          trend: { d7: r.d7, d30: r.d30, ratio: parseFloat(r.ratio) || 0 }
        })),
        byTotal: byTotal.map(r => ({
          medicoId: r.medico_id,
          medicoNome: r.medico_nome,
          medicoEmail: r.medico_email,
          criticos: r.criticos,
          pendencias24h: r.pendencias_24h,
          pendenciasTotal: r.pendencias_total,
          trend: { d7: r.d7, d30: r.d30, ratio: parseFloat(r.ratio) || 0 }
        }))
      }
    });
  } catch (err) {
    console.error("[doctors/alerts] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao buscar alertas" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /prontuarios/:id/audit - Histórico de auditoria de um prontuário
// ═══════════════════════════════════════════════════════════════════════════
router.get("/prontuarios/:id/audit", requireManager, async (req, res) => {
  const start = Date.now();
  
  try {
    const prontuarioId = req.params.id;
    const limit = Math.min(100, parseInt(req.query.limit || "50", 10));
    const offset = Math.max(0, parseInt(req.query.offset || "0", 10));
    
    if (!prontuarioId) {
      return res.status(400).json({ ok: false, error: "ID do prontuário é obrigatório" });
    }
    
    const sql = `
      SELECT
        a.id,
        a.prontuario_id,
        a.actor_user_id,
        a.actor_email,
        a.actor_role,
        a.action,
        a.created_at,
        a.changed_fields,
        a.before,
        a.after,
        a.ip,
        a.user_agent
      FROM prontuario_audit a
      WHERE a.prontuario_id = $1
      ORDER BY a.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const { rows } = await pool.query(sql, [prontuarioId, limit, offset]);
    
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM prontuario_audit WHERE prontuario_id = $1`,
      [prontuarioId]
    );
    const total = parseInt(countRes.rows[0]?.count || "0", 10);
    
    const events = rows.map(r => ({
      id: r.id,
      createdAt: r.created_at,
      actorEmail: r.actor_email,
      actorRole: r.actor_role,
      action: r.action,
      changedFields: r.changed_fields || [],
      before: r.before,
      after: r.after,
      ip: r.ip,
      userAgent: r.user_agent,
    }));
    
    return res.json({
      ok: true,
      tookMs: Date.now() - start,
      prontuarioId,
      paging: { limit, offset, total },
      events,
    });
  } catch (err) {
    console.error("[prontuarios/:id/audit] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao buscar auditoria" });
  }
});

export default router;
