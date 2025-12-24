import express from "express";
import { db, users } from "../../../../db/index.js";
import { eq } from "drizzle-orm";

const router = express.Router();

// ============================================
// MIDDLEWARE: requireInternal
// Protege rotas internas com INTERNAL_TOKEN
// ============================================
function requireInternal(req, res, next) {
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
    if (!["patient", "doctor", "admin"].includes(roleNorm)) {
      return res.status(400).json({ ok: false, error: "role inválida (use: patient, doctor, admin)" });
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

export default router;
