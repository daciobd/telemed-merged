import express from "express";
import { db } from "../../../db/index.js";
import * as schema from "../../../db/schema.cjs";
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";

const router = express.Router();
const { virtualOfficeSettings, consultations, users } = schema;

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

// GET /api/virtual-office/:customUrl - Página pública do médico
router.get("/:customUrl", async (req, res) => {
  try {
    const { customUrl } = req.params;

    const settings = await db
      .select()
      .from(virtualOfficeSettings)
      .where(eq(virtualOfficeSettings.doctor_id, req.user.doctorId)) // ✅ COM doctor_id
      .limit(1);

    if (!settings || settings.length === 0) {
      return res.status(404).json({ error: "Consultório não encontrado" });
    }

    const [setting] = settings;
    const doctor = await db
      .select()
      .from(users)
      .where(eq(users.id, setting.doctorId))
      .limit(1);

    if (!doctor || doctor.length === 0) {
      return res.status(404).json({ error: "Médico não encontrado" });
    }

    res.json({
      doctor: {
        id: doctor[0].id,
        fullName: doctor[0].fullName,
        specialties: doctor[0].specialties || [],
        bio: doctor[0].bio,
        consultationPricing: setting.consultationPricing || {},
      },
    });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    res.status(500).json({ error: "Erro ao carregar consultório" });
  }
});

// GET /api/virtual-office/settings - Obter configurações (autenticado)
router.get("/settings", authenticate, async (req, res) => {
  try {
    const settings = await db
      .select()
      .from(virtualOfficeSettings)
      .where(eq(virtualOfficeSettings.doctorId, req.user.id))
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

    if (!customUrl) {
      return res.status(400).json({ error: "URL personalizada é obrigatória" });
    }

    const existing = await db
      .select()
      .from(virtualOfficeSettings)
      .where(eq(virtualOfficeSettings.doctorId, req.user.id))
      .limit(1);

    if (existing && existing.length > 0) {
      const updated = await db
        .update(virtualOfficeSettings)
        .set({
          customUrl: customUrl.toLowerCase(),
          consultationPricing: consultationPricing || {},
        })
        .where(eq(virtualOfficeSettings.doctorId, req.user.id))
        .returning();

      return res.json({ settings: updated[0] });
    } else {
      const created = await db
        .insert(virtualOfficeSettings)
        .values({
          doctorId: req.user.id,
          customUrl: customUrl.toLowerCase(),
          consultationPricing: consultationPricing || {},
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
    const consultsByDoc = await db
      .select()
      .from(consultations)
      .where(eq(consultations.doctorId, req.user.id));

    const patientIds = [...new Set(consultsByDoc.map((c) => c.patientId))];

    const patients = [];
    for (const patientId of patientIds) {
      const patient = await db
        .select()
        .from(users)
        .where(eq(users.id, patientId))
        .limit(1);

      if (patient && patient.length > 0) {
        const totalConsults = consultsByDoc.filter(
          (c) => c.patientId === patientId,
        ).length;
        patients.push({
          id: patient[0].id,
          fullName: patient[0].fullName,
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

// POST /api/virtual-office/:customUrl/book - Agendar consulta
router.post("/:customUrl/book", async (req, res) => {
  try {
    const { customUrl } = req.params;
    const { patientId, consultationType, scheduledFor, chiefComplaint } =
      req.body;

    const settings = await db
      .select()
      .from(virtualOfficeSettings)
      .where(eq(virtualOfficeSettings.customUrl, customUrl))
      .limit(1);

    if (!settings || settings.length === 0) {
      return res.status(404).json({ error: "Consultório não encontrado" });
    }

    const [setting] = settings;
    const doctorId = setting.doctorId;

    const created = await db
      .insert(consultations)
      .values({
        patientId: patientId || 1,
        doctorId,
        consultationType: consultationType || "primeira_consulta",
        scheduledFor: new Date(scheduledFor),
        chiefComplaint: chiefComplaint || "",
        status: "agendada",
        price: setting.consultationPricing?.[consultationType] || 0,
      })
      .returning();

    res.status(201).json({
      message: "Consulta agendada com sucesso",
      consultation: created[0],
    });
  } catch (error) {
    console.error("Error booking consultation:", error);
    res.status(500).json({ error: "Erro ao agendar consulta" });
  }
});

export default router;
