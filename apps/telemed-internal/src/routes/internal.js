import express from "express";
import { db, users } from "../../../../db/index.js";
import { eq } from "drizzle-orm";

const router = express.Router();

// ============================================
// MIDDLEWARE: requireInternal
// Protege rotas internas com INTERNAL_TOKEN
// Kill switch: INTERNAL_ROUTES_ENABLED=false desliga
// ============================================
function requireInternal(req, res, next) {
  // Kill switch por ENV
  if (process.env.INTERNAL_ROUTES_ENABLED === "false") {
    return res.status(503).json({ ok: false, error: "Rotas internas desabilitadas" });
  }

  const token = req.header("x-internal-token");
  if (!token || token !== process.env.INTERNAL_TOKEN) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }
  next();
}

// ============================================
// POST /users/promote
// Promove usuário para role específica
// ============================================
router.post("/users/promote", requireInternal, async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ ok: false, error: "email e role são obrigatórios" });
    }

    const roleNorm = String(role).toLowerCase();
    
    // HARDENING: Só permite promoção para admin ou doctor (não patient)
    if (!["doctor", "admin"].includes(roleNorm)) {
      return res.status(400).json({ ok: false, error: "role inválida (use: doctor, admin)" });
    }

    // Atualizar role do usuário
    const [updated] = await db
      .update(users)
      .set({ role: roleNorm })
      .where(eq(users.email, email.toLowerCase()))
      .returning();

    if (!updated) {
      return res.status(404).json({ ok: false, error: "Usuário não encontrado" });
    }

    // AUDITORIA: Log sem dados clínicos
    console.log("[INTERNAL PROMOTE]", {
      targetEmail: email.toLowerCase(),
      role: roleNorm,
      ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
      at: new Date().toISOString(),
    });

    return res.json({ 
      ok: true, 
      message: `Usuário ${email} promovido para ${roleNorm}`,
      user: { id: updated.id, email: updated.email, role: updated.role }
    });
  } catch (err) {
    console.error("[internal/promote] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao promover usuário" });
  }
});

// ============================================
// GET /users/list (debug - lista usuários)
// ============================================
router.get("/users/list", requireInternal, async (req, res) => {
  try {
    const allUsers = await db
      .select({ id: users.id, email: users.email, role: users.role, fullName: users.fullName })
      .from(users)
      .limit(50);

    return res.json({ ok: true, users: allUsers });
  } catch (err) {
    console.error("[internal/users/list] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao listar usuários" });
  }
});

// ============================================
// MARKETING / CAC REAL
// ============================================

// GET /marketing/cac-real/details
router.get("/marketing/cac-real/details", requireInternal, async (req, res) => {
  try {
    const { from, to, groupBy = "day" } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros "from" e "to" são obrigatórios'
      });
    }

    // Importar pool para queries diretas
    const { pool } = await import("../db/pool.js");

    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        'marketing_data' as metric
      FROM consultations 
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY DATE(created_at)
      ORDER BY date
      LIMIT 30
    `;

    const result = await pool.query(query, [from, to]);

    res.json({
      success: true,
      data: result.rows,
      meta: { from, to, groupBy }
    });
  } catch (error) {
    console.error("Erro marketing details:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar dados"
    });
  }
});

// GET /marketing/cac-real/alerts
router.get("/marketing/cac-real/alerts", requireInternal, async (req, res) => {
  res.json({
    success: true,
    alerts: [
      { type: "high_cac", message: "CAC acima do esperado", date: new Date().toISOString().split("T")[0] }
    ]
  });
});

// POST /marketing/spend - Inserir gastos de marketing
router.post("/marketing/spend", requireInternal, async (req, res) => {
  try {
    const { provider, account_id, currency, rows } = req.body;

    if (!provider || !rows || !Array.isArray(rows)) {
      return res.status(400).json({
        success: false,
        message: "provider e rows são obrigatórios"
      });
    }

    const { pool } = await import("../db/pool.js");

    let inserted = 0;
    for (const row of rows) {
      const { date, spend } = row;
      if (!date || spend == null) continue;

      await pool.query(
        `INSERT INTO marketing_spend (provider, account_id, currency, spend_date, amount_cents, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (provider, account_id, spend_date) 
         DO UPDATE SET amount_cents = $5, updated_at = NOW()`,
        [provider, account_id || "default", currency || "BRL", date, Math.round(spend * 100)]
      );
      inserted++;
    }

    res.json({ success: true, inserted });
  } catch (error) {
    console.error("Erro marketing spend:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Erro ao inserir gastos"
    });
  }
});

// ============================================
// POST /payments/confirm - Confirmar pagamento e agendar consulta (IDEMPOTENTE)
// ============================================
router.post("/payments/confirm", requireInternal, async (req, res) => {
  try {
    const { consultationId } = req.body;
    const id = Number(consultationId);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ ok: false, error: "missing_or_invalid_consultationId" });
    }

    const { pool } = await import("../db/pool.js");

    // 1) Buscar payment mais recente da consulta
    const p = await pool.query(
      `SELECT id, status, paid_at, amount
       FROM payments
       WHERE consultation_id = $1
       ORDER BY id DESC
       LIMIT 1`,
      [id]
    );

    if (p.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "payment_not_found" });
    }

    const payment = p.rows[0];
    let paymentRow = payment;
    let wasIdempotent = false;

    // 2) Se pending → marcar como paid; se já paid → idempotente
    if (payment.status === "pending") {
      const payUpd = await pool.query(
        `UPDATE payments
         SET status = 'paid',
             paid_at = now()
         WHERE id = $1
         RETURNING id, consultation_id, status, paid_at, amount`,
        [payment.id]
      );
      paymentRow = payUpd.rows[0];
    } else if (payment.status === "paid") {
      wasIdempotent = true;
    } else {
      // cancelled/failed/etc
      return res.status(409).json({
        ok: false,
        error: "payment_not_pending",
        paymentStatus: payment.status
      });
    }

    // 3) Garantir consulta scheduled (idempotente)
    const cons = await pool.query(
      `UPDATE consultations
       SET status = 'scheduled', updated_at = now()
       WHERE id = $1 AND status = 'pending'
       RETURNING id, status, scheduled_for`,
      [id]
    );

    // Se já estava scheduled, buscar estado atual
    let consultationRow = cons.rows[0];
    if (!consultationRow) {
      const c2 = await pool.query(
        `SELECT id, status, scheduled_for
         FROM consultations
         WHERE id = $1
         LIMIT 1`,
        [id]
      );
      consultationRow = c2.rows[0] ?? null;
    }

    console.log("[PAYMENT CONFIRM]", {
      consultationId: id,
      paymentId: paymentRow.id,
      idempotent: wasIdempotent,
      at: new Date().toISOString()
    });

    return res.json({
      ok: true,
      payment: paymentRow,
      consultation: consultationRow,
      idempotent: wasIdempotent
    });
  } catch (err) {
    console.error("[internal/payments/confirm] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "internal_error" });
  }
});

// ============================================
// GET /dbinfo - Debug: info do banco de dados
// ============================================
router.get("/dbinfo", requireInternal, async (req, res) => {
  try {
    const { pool } = await import("../db/pool.js");
    const r = await pool.query(`
      SELECT
        current_database() AS db,
        current_user AS usr,
        inet_server_addr() AS host,
        inet_server_port() AS port,
        now() AS now
    `);

    return res.json({ ok: true, dbinfo: r.rows[0] });
  } catch (err) {
    console.error("[internal/dbinfo] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "internal_error" });
  }
});

// ============================================
// POST /consultations/expire-pending - Expirar consultas pendentes (TTL)
// Aceita ttlMinutes decimal (ex: 0.5 = 30 segundos) para testes QA
// ============================================
router.post("/consultations/expire-pending", requireInternal, async (req, res) => {
  try {
    const { ttlMinutes } = req.body ?? {};
    const ttl = Number(ttlMinutes ?? process.env.PAYMENT_HOLD_MINUTES ?? 15);

    if (!Number.isFinite(ttl) || ttl <= 0) {
      return res.status(400).json({ ok: false, error: "missing_or_invalid_ttlMinutes" });
    }

    // Converter para segundos (permite float para QA: 0.5 min = 30s)
    // ceil + min 1s evita TTL=0
    const ttlSeconds = Math.max(1, Math.ceil(ttl * 60));

    const { pool } = await import("../db/pool.js");

    const q = `
      WITH expired AS (
        UPDATE consultations
        SET status = 'cancelled',
            updated_at = now()
        WHERE status = 'pending'
          AND created_at < now() - make_interval(secs => $1)
        RETURNING id
      ),
      cancelled_payments AS (
        UPDATE payments
        SET status = 'cancelled'
        WHERE status = 'pending'
          AND consultation_id IN (SELECT id FROM expired)
        RETURNING id
      )
      SELECT
        (SELECT count(*) FROM expired) AS expired_consultations,
        (SELECT count(*) FROM cancelled_payments) AS cancelled_payments;
    `;

    const r = await pool.query(q, [ttlSeconds]);
    const row = r.rows?.[0] ?? { expired_consultations: 0, cancelled_payments: 0 };

    console.log("[EXPIRE PENDING]", {
      ttlMinutes: ttl,
      ttlSeconds,
      expiredConsultations: Number(row.expired_consultations || 0),
      cancelledPayments: Number(row.cancelled_payments || 0),
      at: new Date().toISOString()
    });

    return res.json({
      ok: true,
      ttlMinutes: ttl,
      ttlSeconds,
      expiredConsultations: Number(row.expired_consultations || 0),
      cancelledPayments: Number(row.cancelled_payments || 0)
    });
  } catch (err) {
    console.error("[internal/consultations/expire-pending] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "internal_error" });
  }
});

// ============================================
// QA: POST /consultations/:id/status
// Testa bloqueio de pagamento (paymentGuard)
// ============================================
router.post("/consultations/:id/status", requireInternal, async (req, res) => {
  try {
    const consultationId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!consultationId || !status) {
      return res.status(400).json({ ok: false, error: "id e status são obrigatórios" });
    }

    const { pool } = await import("../db/pool.js");

    // Buscar consulta atual
    const { rows: [consultation] } = await pool.query(
      "SELECT id, status, patient_id, doctor_id FROM consultations WHERE id = $1",
      [consultationId]
    );

    if (!consultation) {
      return res.status(404).json({ ok: false, error: "Consulta não encontrada" });
    }

    // Status que exigem pagamento confirmado
    const requiresPayment = ["scheduled", "in_progress", "completed"];
    
    if (requiresPayment.includes(status)) {
      // Verificar se existe pagamento confirmado
      const { rows: [payment] } = await pool.query(
        `SELECT id, status, paid_at 
         FROM payments 
         WHERE consultation_id = $1 
           AND status = 'completed' 
           AND paid_at IS NOT NULL
         LIMIT 1`,
        [consultationId]
      );

      if (!payment) {
        console.log("[QA] Bloqueio de pagamento ativado", { consultationId, targetStatus: status });
        return res.status(402).json({
          ok: false,
          error: "Pagamento não confirmado",
          message: `Não é possível avançar para '${status}' sem pagamento confirmado (payments.status='completed' AND paid_at IS NOT NULL)`,
          currentStatus: consultation.status,
          targetStatus: status,
          paymentRequired: true
        });
      }
    }

    // Atualizar status
    await pool.query(
      "UPDATE consultations SET status = $1, updated_at = NOW() WHERE id = $2",
      [status, consultationId]
    );

    console.log("[QA] Status atualizado", { consultationId, from: consultation.status, to: status });

    return res.json({
      ok: true,
      message: `Status atualizado de '${consultation.status}' para '${status}'`,
      consultationId,
      previousStatus: consultation.status,
      newStatus: status
    });
  } catch (err) {
    console.error("[internal/consultations/status] erro:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Erro ao atualizar status" });
  }
});

export default router;
