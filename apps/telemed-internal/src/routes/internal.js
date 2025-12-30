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

export default router;
