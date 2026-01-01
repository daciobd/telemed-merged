import express from "express";
import { db } from "../../../db/index.js";
import * as schema from "../../../db/schema.cjs";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const router = express.Router();
const { virtualOfficeSettings, consultations, users, doctors } = schema;

function calcFees(agreedPrice) {
  const feeRate = 0.2;
  const platformFee = Math.round(agreedPrice * feeRate * 100) / 100;
  const doctorEarnings = Math.round((agreedPrice - platformFee) * 100) / 100;
  return { platformFee, doctorEarnings };
}

// Middleware de autenticação
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token não fornecido" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }
};

// ============================================
// ROTAS ESPECÍFICAS (DEVEM VIR ANTES DE /:customUrl)
// ============================================

// GET /api/virtual-office/settings - Obter configurações (autenticado)
router.get("/settings", authenticate, async (req, res) => {
  try {
    // Buscar doctor pelo user_id
    const doctorRows = await db
      .select()
      .from(doctors)
      .where(eq(doctors.user_id, req.user.id))
      .limit(1);

    if (!doctorRows || doctorRows.length === 0) {
      return res.json({ settings: null });
    }

    const doctor = doctorRows[0];

    const settings = await db
      .select()
      .from(virtualOfficeSettings)
      .where(eq(virtualOfficeSettings.doctor_id, doctor.id))
      .limit(1);

    if (!settings || settings.length === 0) {
      return res.json({ settings: null });
    }

    res.json({ settings: settings[0] });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Erro ao carregar configurações" });
  }
});

// PATCH /api/virtual-office/settings - Salvar configurações (autenticado)
router.patch("/settings", authenticate, async (req, res) => {
  try {
    const { customUrl, consultationPricing } = req.body;

    // Buscar doctor pelo user_id
    const doctorRows = await db
      .select()
      .from(doctors)
      .where(eq(doctors.user_id, req.user.id))
      .limit(1);

    if (!doctorRows || doctorRows.length === 0) {
      return res.status(404).json({ error: "Perfil de médico não encontrado" });
    }

    const doctor = doctorRows[0];

    // Atualizar custom_url no doctor se fornecido
    if (customUrl) {
      await db
        .update(doctors)
        .set({ custom_url: customUrl.toLowerCase() })
        .where(eq(doctors.id, doctor.id));
    }

    // Atualizar ou criar settings
    const existing = await db
      .select()
      .from(virtualOfficeSettings)
      .where(eq(virtualOfficeSettings.doctor_id, doctor.id))
      .limit(1);

    if (existing && existing.length > 0) {
      const updated = await db
        .update(virtualOfficeSettings)
        .set({
          consultation_pricing: consultationPricing || {},
        })
        .where(eq(virtualOfficeSettings.doctor_id, doctor.id))
        .returning();

      return res.json({ settings: updated[0] });
    } else {
      const created = await db
        .insert(virtualOfficeSettings)
        .values({
          doctor_id: doctor.id,
          consultation_pricing: consultationPricing || {},
        })
        .returning();

      return res.json({ settings: created[0] });
    }
  } catch (error) {
    console.error("Error saving settings:", error);
    res.status(500).json({ error: "Erro ao salvar configurações" });
  }
});

// GET /api/virtual-office/my-patients - Meus pacientes (autenticado)
router.get("/my-patients", authenticate, async (req, res) => {
  try {
    // Buscar doctor pelo user_id
    const doctorRows = await db
      .select()
      .from(doctors)
      .where(eq(doctors.user_id, req.user.id))
      .limit(1);

    if (!doctorRows || doctorRows.length === 0) {
      return res.status(404).json({ error: "Perfil de médico não encontrado" });
    }

    const doctor = doctorRows[0];

    const consultsByDoc = await db
      .select()
      .from(consultations)
      .where(eq(consultations.doctor_id, doctor.id));

    const patientIds = [...new Set(consultsByDoc.map((c) => c.patient_id))];

    const patients = [];
    for (const patientId of patientIds) {
      const patient = await db
        .select()
        .from(users)
        .where(eq(users.id, patientId))
        .limit(1);

      if (patient && patient.length > 0) {
        const totalConsults = consultsByDoc.filter(
          (c) => c.patient_id === patientId,
        ).length;
        patients.push({
          id: patient[0].id,
          fullName: patient[0].full_name,
          email: patient[0].email,
          phone: patient[0].phone,
          totalConsultations: totalConsults,
        });
      }
    }

    res.json({ patients });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ error: "Erro ao carregar pacientes" });
  }
});

// ============================================
// ROTAS DINÂMICAS (DEVEM VIR POR ÚLTIMO)
// ============================================

// POST /api/virtual-office/:customUrl/book - Agendar consulta
router.post("/:customUrl/book", async (req, res) => {
  try {
    const { customUrl } = req.params;
    const { patientId, consultationType, scheduledFor, chiefComplaint } = req.body;

    // 1) Doctor por custom_url (snake_case)
    const doctorRows = await db
      .select()
      .from(doctors)
      .where(eq(doctors.custom_url, customUrl))
      .limit(1);

    if (!doctorRows || doctorRows.length === 0) {
      return res.status(404).json({ error: "Consultório não encontrado" });
    }

    const doctor = doctorRows[0];

    // 2) Pricing correto (snake_case)
    const pricing = doctor.consultation_pricing || {};
    const ct = consultationType || "primeira_consulta";
    const price = Number(pricing[ct] ?? pricing["primeira_consulta"] ?? 0);
    const { platformFee, doctorEarnings } = calcFees(price);

    // 3) Inserir com nomes de colunas snake_case
    const created = await db
      .insert(consultations)
      .values({
        patient_id: patientId,
        doctor_id: doctor.id,
        consultation_type: ct,
        scheduled_for: scheduledFor ? new Date(scheduledFor) : null,
        chief_complaint: chiefComplaint || "",
        status: "pending",
        agreed_price: price,
        platform_fee: platformFee,
        doctor_earnings: doctorEarnings,
        is_marketplace: false,
      })
      .returning();

    return res.status(201).json({
      message: "Consulta agendada com sucesso",
      consultation: created[0],
    });
  } catch (error) {
    console.error("Error booking consultation:", error);
    return res.status(500).json({ error: "Erro ao agendar consulta" });
  }
});

// GET /api/virtual-office/:customUrl - Página pública do médico (ÚLTIMO!)
router.get("/:customUrl", async (req, res) => {
  try {
    const { customUrl } = req.params;

    // 1) Buscar doctor pelo custom_url
    const doctorRows = await db
      .select()
      .from(doctors)
      .where(eq(doctors.custom_url, customUrl))
      .limit(1);

    if (!doctorRows || doctorRows.length === 0) {
      return res.status(404).json({ error: "Consultório não encontrado" });
    }

    const doctor = doctorRows[0];

    // 2) Settings opcionais
    const settingsRows = await db
      .select()
      .from(virtualOfficeSettings)
      .where(eq(virtualOfficeSettings.doctor_id, doctor.id))
      .limit(1);

    const setting = settingsRows?.[0] || null;

    // 3) Dados do user do médico
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, doctor.user_id))
      .limit(1);

    const user = userRows?.[0] || null;

    return res.json({
      doctor: {
        id: doctor.id,
        fullName: user?.full_name || null,
        specialties: doctor.specialties || [],
        bio: doctor.bio || null,
        consultationPricing: doctor.consultation_pricing || {},
        availability: doctor.availability || {},
      },
      settings: setting,
    });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    return res.status(500).json({ error: "Erro ao carregar consultório" });
  }
});

export default router;
