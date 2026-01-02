import express from "express";
import { db } from "../../../db/index.js";
import * as schema from "../../../db/schema.cjs";
import { eq, and, inArray } from "drizzle-orm";
import jwt from "jsonwebtoken";

const ACTIVE_STATUSES = ["pending", "scheduled", "in_progress", "doctor_matched"];

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
      .where(eq(doctors.userId, req.user.id))
      .limit(1);

    if (!doctorRows || doctorRows.length === 0) {
      return res.json({ settings: null });
    }

    const doctor = doctorRows[0];

    const settings = await db
      .select()
      .from(virtualOfficeSettings)
      .where(eq(virtualOfficeSettings.doctorId, doctor.id))
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
      .where(eq(doctors.userId, req.user.id))
      .limit(1);

    if (!doctorRows || doctorRows.length === 0) {
      return res.status(404).json({ error: "Perfil de médico não encontrado" });
    }

    const doctor = doctorRows[0];

    // Atualizar customUrl no doctor se fornecido
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
      .where(eq(virtualOfficeSettings.doctorId, doctor.id))
      .limit(1);

    if (existing && existing.length > 0) {
      const updated = await db
        .update(virtualOfficeSettings)
        .set({
          consultationPricing: consultationPricing || {},
        })
        .where(eq(virtualOfficeSettings.doctorId, doctor.id))
        .returning();

      return res.json({ settings: updated[0] });
    } else {
      const created = await db
        .insert(virtualOfficeSettings)
        .values({
          doctorId: doctor.id,
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
    // Buscar doctor pelo user_id
    const doctorRows = await db
      .select()
      .from(doctors)
      .where(eq(doctors.userId, req.user.id))
      .limit(1);

    if (!doctorRows || doctorRows.length === 0) {
      return res.status(404).json({ error: "Perfil de médico não encontrado" });
    }

    const doctor = doctorRows[0];

    const consultsByDoc = await db
      .select()
      .from(consultations)
      .where(eq(consultations.doctorId, doctor.id));

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

// ============================================
// ROTAS DINÂMICAS (DEVEM VIR POR ÚLTIMO)
// ============================================

// GET /api/virtual-office/:customUrl/slots?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/:customUrl/slots", async (req, res) => {
  try {
    const { customUrl } = req.params;
    const customUrlNorm = String(customUrl || "").trim().toLowerCase();

    const fromStr = String(req.query.from || "");
    const toStr = String(req.query.to || "");
    if (!fromStr || !toStr) {
      return res.status(400).json({ error: "Parâmetros 'from' e 'to' são obrigatórios (YYYY-MM-DD)" });
    }

    const from = new Date(`${fromStr}T00:00:00.000Z`);
    const to = new Date(`${toStr}T00:00:00.000Z`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return res.status(400).json({ error: "Datas inválidas. Use YYYY-MM-DD" });
    }

    const doctorRows = await db
      .select()
      .from(doctors)
      .where(eq(doctors.customUrl, customUrlNorm))
      .limit(1);

    if (!doctorRows || doctorRows.length === 0) {
      return res.status(404).json({ error: "Consultório não encontrado" });
    }

    const doctor = doctorRows[0];
    const availability = doctor.availability || {};
    const durationMin = Number(doctor.consultationDuration || 30);

    // Consultas ocupadas no período (apenas status ativos)
    const busyRows = await db
      .select({ scheduledFor: consultations.scheduledFor })
      .from(consultations)
      .where(
        and(
          eq(consultations.doctorId, doctor.id),
          inArray(consultations.status, ACTIVE_STATUSES)
        )
      );

    const busySet = new Set(
      busyRows
        .map((r) => (r.scheduledFor ? new Date(r.scheduledFor).toISOString() : null))
        .filter(Boolean)
    );

    const dayMap = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

    function* slotGenerator(dayDate, ranges) {
      for (const range of ranges) {
        const [startStr, endStr] = range.split("-");
        const [sh, sm] = startStr.split(":").map(Number);
        const [eh, em] = endStr.split(":").map(Number);

        const start = new Date(dayDate);
        start.setUTCHours(sh, sm, 0, 0);

        const end = new Date(dayDate);
        end.setUTCHours(eh, em, 0, 0);

        for (let t = new Date(start); t < end; t = new Date(t.getTime() + durationMin * 60000)) {
          yield new Date(t);
        }
      }
    }

    const slots = [];
    for (let d = new Date(from); d < to; d = new Date(d.getTime() + 24 * 60 * 60000)) {
      const weekdayKey = dayMap[d.getUTCDay()];
      const ranges = availability[weekdayKey] || [];
      for (const slot of slotGenerator(d, ranges)) {
        const iso = slot.toISOString();
        if (!busySet.has(iso)) {
          slots.push(iso);
        }
      }
    }

    return res.json({ doctorId: doctor.id, from: fromStr, to: toStr, durationMin, slots });
  } catch (error) {
    console.error("Error fetching slots:", error);
    return res.status(500).json({ error: "Erro ao carregar agenda" });
  }
});

// POST /api/virtual-office/:customUrl/book - Agendar consulta
router.post("/:customUrl/book", async (req, res) => {
  try {
    const { customUrl } = req.params;
    const customUrlNorm = String(customUrl || "").trim().toLowerCase();
    const { patientId, consultationType, scheduledFor, chiefComplaint } = req.body;

    // 1) Doctor por customUrl (Drizzle camelCase)
    const doctorRows = await db
      .select()
      .from(doctors)
      .where(eq(doctors.customUrl, customUrlNorm))
      .limit(1);

    if (!doctorRows || doctorRows.length === 0) {
      return res.status(404).json({ error: "Consultório não encontrado" });
    }

    const doctor = doctorRows[0];

    // 2) Validar scheduledFor
    if (!scheduledFor) {
      return res.status(400).json({ error: "scheduledFor é obrigatório" });
    }

    const scheduledDate = new Date(scheduledFor);
    if (Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ error: "scheduledFor inválido (use ISO)" });
    }

    // 3) Checar se o horário está dentro da disponibilidade do médico
    const availability = doctor.availability || {};
    const dayMap = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
    const weekdayKey = dayMap[scheduledDate.getUTCDay()];
    const ranges = availability[weekdayKey] || [];

    function isWithinRanges(dateObj, rangesArr) {
      if (rangesArr.length === 0) return true; // Se não tem disponibilidade definida, aceita
      const hh = String(dateObj.getUTCHours()).padStart(2, "0");
      const mm = String(dateObj.getUTCMinutes()).padStart(2, "0");
      const time = `${hh}:${mm}`;
      return rangesArr.some((r) => {
        const [a, b] = r.split("-");
        return time >= a && time < b;
      });
    }

    if (ranges.length > 0 && !isWithinRanges(scheduledDate, ranges)) {
      return res.status(409).json({ error: "Horário indisponível" });
    }

    // 4) Checar conflito (mesmo horário - apenas status ativos)
    const conflictRows = await db
      .select({ id: consultations.id, scheduledFor: consultations.scheduledFor })
      .from(consultations)
      .where(
        and(
          eq(consultations.doctorId, doctor.id),
          inArray(consultations.status, ACTIVE_STATUSES)
        )
      );

    const hasExact = conflictRows.some(
      (r) => r.scheduledFor && new Date(r.scheduledFor).toISOString() === scheduledDate.toISOString()
    );
    if (hasExact) {
      return res.status(409).json({ error: "Horário já ocupado" });
    }

    // 5) Pricing
    const pricing = doctor.consultationPricing || {};
    const ct = consultationType || "primeira_consulta";
    const price = Number(pricing[ct] ?? pricing["primeira_consulta"] ?? 0);
    const { platformFee, doctorEarnings } = calcFees(price);

    // 6) Inserir com nomes Drizzle (camelCase)
    const created = await db
      .insert(consultations)
      .values({
        patientId: patientId,
        doctorId: doctor.id,
        consultationType: ct,
        scheduledFor: scheduledDate,
        chiefComplaint: chiefComplaint || "",
        status: "pending",
        agreedPrice: String(price),
        platformFee: String(platformFee),
        doctorEarnings: String(doctorEarnings),
        isMarketplace: false,
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
    const customUrlNorm = String(customUrl || "").trim().toLowerCase();

    // 1) Buscar doctor pelo customUrl (Drizzle camelCase)
    const doctorRows = await db
      .select()
      .from(doctors)
      .where(eq(doctors.customUrl, customUrlNorm))
      .limit(1);

    if (!doctorRows || doctorRows.length === 0) {
      return res.status(404).json({ error: "Consultório não encontrado" });
    }

    const doctor = doctorRows[0];

    // 2) Settings opcionais
    const settingsRows = await db
      .select()
      .from(virtualOfficeSettings)
      .where(eq(virtualOfficeSettings.doctorId, doctor.id))
      .limit(1);

    const setting = settingsRows?.[0] || null;

    // 3) Dados do user do médico
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, doctor.userId))
      .limit(1);

    const user = userRows?.[0] || null;

    return res.json({
      doctor: {
        id: doctor.id,
        fullName: user?.fullName || null,
        specialties: doctor.specialties || [],
        bio: doctor.bio || null,
        consultationPricing: doctor.consultationPricing || {},
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
