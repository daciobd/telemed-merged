import express from "express";
import crypto from "crypto";
import { db } from "../../../db/index.js";
import * as schema from "../../../db/schema.cjs";
import { eq, and, gte, lt, inArray, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";

const router = express.Router();

const { users, patients, doctors, consultations, virtualOfficeSettings, payments } = schema;

const ACTIVE_STATUSES = ["pending", "scheduled", "in_progress", "doctor_matched"];
// ===== Meet token helpers (PACIENTE) =====
const MEET_TOKEN_SECRET = process.env.MEET_TOKEN_SECRET || process.env.JWT_SECRET || null;

// pode entrar 10 min antes e até 60 min depois do fim (ajuste se quiser)
const MEET_EARLY_MINUTES = Number(process.env.MEET_EARLY_MINUTES || 10);
const MEET_LATE_MINUTES = Number(process.env.MEET_LATE_MINUTES || 60);
function signMeetToken({ consultationId, role, scheduledForISO, durationMinutes = 30 }) {
  if (!MEET_TOKEN_SECRET) throw new Error("MEET_TOKEN_SECRET_not_configured");

  if (role !== "patient" && role !== "doctor") {
    throw new Error("invalid_role");
  }

  const scheduledMs = new Date(scheduledForISO).getTime();
  if (!Number.isFinite(scheduledMs)) throw new Error("invalid_scheduledFor");

  const startMs = scheduledMs - MEET_EARLY_MINUTES * 60_000;
  const endMs = scheduledMs + durationMinutes * 60_000 + MEET_LATE_MINUTES * 60_000;

  const nbf = Math.floor(startMs / 1000);
  const exp = Math.floor(endMs / 1000);

  // jwt.sign: nbf e exp devem estar no payload para serem absolutos
  // As opções notBefore e expiresIn são RELATIVAS ao iat
  const token = jwt.sign(
    { cid: Number(consultationId), role, nbf, exp },
    MEET_TOKEN_SECRET,
    { issuer: "telemed", audience: "consultorio-meet" }
  );

  return { token, nbf, exp };
}

function signMeetTokenPatient({ consultationId, scheduledForISO, durationMinutes = 30 }) {
  return signMeetToken({ consultationId, role: "patient", scheduledForISO, durationMinutes });
}

function signMeetTokenDoctor({ consultationId, scheduledForISO, durationMinutes = 30 }) {
  return signMeetToken({ consultationId, role: "doctor", scheduledForISO, durationMinutes });
}


function getPricingForType(consultationPricing, consultationType) {
  if (!consultationPricing) return null;
  
  // Caso seja número (preço único)
  if (typeof consultationPricing === "number" || typeof consultationPricing === "string") {
    const cents = normalizeMoneyToCents(consultationPricing);
    return cents ? { priceCents: cents, duration: 30 } : null;
  }
  
  // Caso seja objeto {price,duration}
  if (consultationPricing.price != null) {
    const cents = normalizeMoneyToCents(consultationPricing.price);
    const duration = consultationPricing.duration ?? 30;
    return cents ? { priceCents: cents, duration } : null;
  }
  
  // Caso seja mapa por tipo + default
  const byType = consultationPricing[consultationType];
  const def = consultationPricing.default;
  
  const chosen = byType ?? def;
  if (!chosen) return null;
  
  const cents = normalizeMoneyToCents(chosen.price);
  const duration = chosen.duration ?? 30;
  return cents ? { priceCents: cents, duration } : null;
}

function calcFeesFromCents(agreedPriceCents) {
  const platformFeeCents = Math.round(agreedPriceCents * 0.20);
  const doctorEarningsCents = agreedPriceCents - platformFeeCents;
  return { platformFeeCents, doctorEarningsCents };
}

// Legacy (manter compatibilidade)
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
// ENDPOINT INTERNO: Confirmar Pagamento (simulador gateway)
// ============================================

// POST /api/virtual-office/internal/payments/:consultationId/confirm
router.post("/internal/payments/:consultationId/confirm", async (req, res) => {
  try {
    // Validar token interno
    const internalToken = req.headers["x-internal-token"];
    if (internalToken !== process.env.INTERNAL_TOKEN) {
      return res.status(401).json({ error: "Token interno inválido" });
    }

    const consultationId = parseInt(req.params.consultationId, 10);
    if (Number.isNaN(consultationId)) {
      return res.status(400).json({ error: "consultationId inválido" });
    }

    // 1) Buscar payment (pendente ou já pago para idempotência)
    const paymentRows = await db
      .select()
      .from(payments)
      .where(eq(payments.consultationId, consultationId))
      .limit(1);

    if (!paymentRows || paymentRows.length === 0) {
      return res.status(404).json({ error: "Pagamento não encontrado para esta consulta" });
    }

    const payment = paymentRows[0];

    // Idempotência: se já está pago, retornar links existentes
    if (payment.status === "paid") {
      const existingConsult = await db
        .select({
          id: consultations.id,
          meetingUrl: consultations.meetingUrl,
          scheduledFor: consultations.scheduledFor,
          duration: consultations.duration,
          status: consultations.status,
        })
        .from(consultations)
        .where(eq(consultations.id, consultationId))
        .limit(1);

      // Gerar novos tokens JWT (mesmo se já confirmado)
      let patientJoinUrl = null;
      let doctorJoinUrl = null;
      
      if (existingConsult?.[0]?.scheduledFor) {
        try {
          const { token } = signMeetTokenPatient({
            consultationId,
            scheduledForISO: existingConsult[0].scheduledFor,
            durationMinutes: existingConsult[0].duration || 30,
          });
          patientJoinUrl = `/consultorio/meet/${consultationId}?t=${encodeURIComponent(token)}`;
        } catch (e) { /* ignore */ }
        
        try {
          const { token } = signMeetTokenDoctor({
            consultationId,
            scheduledForISO: existingConsult[0].scheduledFor,
            durationMinutes: existingConsult[0].duration || 30,
          });
          doctorJoinUrl = `/consultorio/meet/${consultationId}?t=${encodeURIComponent(token)}`;
        } catch (e) { /* ignore */ }
      }

      return res.json({
        message: "Pagamento já confirmado anteriormente.",
        paymentId: payment.id,
        consultationId,
        newPaymentStatus: payment.status,
        newConsultationStatus: existingConsult?.[0]?.status || "scheduled",
        meetingUrl: existingConsult?.[0]?.meetingUrl || null,
        patientJoinUrl,
        doctorJoinUrl,
        idempotent: true,
      });
    }

    // Se não está pending, status inválido
    if (payment.status !== "pending") {
      return res.status(409).json({ 
        error: `Pagamento em status inválido: ${payment.status}`,
        currentStatus: payment.status,
      });
    }

    // 2) Atualizar payment para 'paid'
    await db
      .update(payments)
      .set({ 
        status: "paid", 
        paidAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    // 3) Atualizar consulta para 'scheduled' + gerar meetingUrl
    const meetToken = crypto.randomUUID();
    const meetingUrl = `/consultorio/meet/${consultationId}?t=${meetToken}`;

    await db
      .update(consultations)
      .set({ 
        status: "scheduled",
        meetingUrl: sql`COALESCE(${consultations.meetingUrl}, ${meetingUrl})`,
        updatedAt: new Date(),
      })
      .where(eq(consultations.id, consultationId));

    // Buscar consulta atualizada (incluindo scheduledFor e duration)
    const updatedConsult = await db
      .select({
        id: consultations.id,
        meetingUrl: consultations.meetingUrl,
        scheduledFor: consultations.scheduledFor,
        duration: consultations.duration,
      })
      .from(consultations)
      .where(eq(consultations.id, consultationId))
      .limit(1);

    // gera link do paciente com token que expira
    let patientJoinUrl = null;
    try {
      const scheduledForISO = updatedConsult?.[0]?.scheduledFor;
      const durationMinutes = updatedConsult?.[0]?.duration || 30;

      const { token } = signMeetTokenPatient({
        consultationId,
        scheduledForISO,
        durationMinutes,
      });

      patientJoinUrl = `/consultorio/meet/${consultationId}?t=${encodeURIComponent(token)}`;
    } catch (e) {
      console.warn("[meet-link] could not generate patientJoinUrl:", e?.message || String(e));
    }

    // gera link do médico com token que expira
    let doctorJoinUrl = null;
    try {
      const scheduledForISO = updatedConsult?.[0]?.scheduledFor;
      const durationMinutes = updatedConsult?.[0]?.duration || 30;

      const { token } = signMeetTokenDoctor({
        consultationId,
        scheduledForISO,
        durationMinutes,
      });

      doctorJoinUrl = `/consultorio/meet/${consultationId}?t=${encodeURIComponent(token)}`;
    } catch (e) {
      console.warn("[meet-link] could not generate doctorJoinUrl:", e?.message || String(e));
    }

    return res.json({
      message: "Pagamento confirmado. Consulta agendada.",
      paymentId: payment.id,
      consultationId,
      newPaymentStatus: "paid",
      newConsultationStatus: "scheduled",
      meetingUrl: updatedConsult[0]?.meetingUrl ?? meetingUrl,
      patientJoinUrl,
      doctorJoinUrl,
    });
  } catch (error) {
    console.error("[virtual-office/payments/confirm] erro:", error);
    return res.status(500).json({ error: error?.message || "Erro interno" });
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

    // Trata "from/to" como datas no fuso de São Paulo (UTC-03)
    function spStartOfDay(yyyy_mm_dd) {
      const d = new Date(`${yyyy_mm_dd}T00:00:00.000Z`);
      d.setUTCHours(d.getUTCHours() + 3); // agora representa 00:00 em -03
      return d;
    }

    const from = spStartOfDay(fromStr);
    const to = spStartOfDay(toStr);
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

    // Consultas ocupadas no período (apenas scheduled/in_progress no range)
    const busyRows = await db
      .select({ scheduledFor: consultations.scheduledFor })
      .from(consultations)
      .where(
        and(
          eq(consultations.doctorId, doctor.id),
          gte(consultations.scheduledFor, from),
          lt(consultations.scheduledFor, to),
          inArray(consultations.status, ["pending", "scheduled", "in_progress"])
        )
      );

    const busySet = new Set(
      busyRows
        .map((r) => (r.scheduledFor ? new Date(r.scheduledFor).toISOString() : null))
        .filter(Boolean)
    );

    // Função para obter dia da semana em horário SP
    function spWeekdayKey(dateUtc) {
      const sp = new Date(dateUtc.getTime() - 3 * 60 * 60000);
      const dayMap = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
      return dayMap[sp.getUTCDay()];
    }

    function* slotGenerator(dayDate, ranges) {
      for (const range of ranges) {
        const [startStr, endStr] = range.split("-");
        const [sh, sm] = startStr.split(":").map(Number);
        const [eh, em] = endStr.split(":").map(Number);

        const start = new Date(dayDate);
        start.setUTCHours(sh + 3, sm, 0, 0); // ranges são em horário SP, +3 para UTC

        const end = new Date(dayDate);
        end.setUTCHours(eh + 3, em, 0, 0);

        for (let t = new Date(start); t < end; t = new Date(t.getTime() + durationMin * 60000)) {
          yield new Date(t);
        }
      }
    }

    const slots = [];
    for (let d = new Date(from); d < to; d = new Date(d.getTime() + 24 * 60 * 60000)) {
      const weekdayKey = spWeekdayKey(d);
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

    // 3) Checar se o horário está dentro da disponibilidade do médico (timezone SP)
    const availability = doctor.availability || {};
    
    // Converte UTC para horário SP (-03) para obter dia da semana correto
    function spWeekdayKeyBook(dateUtc) {
      const sp = new Date(dateUtc.getTime() - 3 * 60 * 60000);
      const dayMap = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
      return dayMap[sp.getUTCDay()];
    }
    
    const weekdayKey = spWeekdayKeyBook(scheduledDate);
    const ranges = availability[weekdayKey] || [];

    // Valida se horário UTC está dentro dos ranges (que já foram convertidos SP→UTC no /slots)
    // Ranges são em horário SP, scheduledDate vem em UTC (já convertido +3h pelo frontend/slots)
    function isWithinRangesSP(dateUtc, rangesArr) {
      if (rangesArr.length === 0) return true;
      // Converte UTC para horário SP para comparar com ranges locais
      const spDate = new Date(dateUtc.getTime() - 3 * 60 * 60000);
      const hh = String(spDate.getUTCHours()).padStart(2, "0");
      const mm = String(spDate.getUTCMinutes()).padStart(2, "0");
      const time = `${hh}:${mm}`;
      return rangesArr.some((r) => {
        const [a, b] = r.split("-");
        return time >= a && time < b;
      });
    }

    if (ranges.length > 0 && !isWithinRangesSP(scheduledDate, ranges)) {
      return res.status(409).json({ error: "Horário indisponível" });
    }

    // 4) Bloquear double-booking com query direta no banco
    const conflictRows = await db
      .select({ id: consultations.id, status: consultations.status })
      .from(consultations)
      .where(
        and(
          eq(consultations.doctorId, doctor.id),
          eq(consultations.scheduledFor, scheduledDate),
          inArray(consultations.status, ["pending", "scheduled", "in_progress"])
        )
      )
      .limit(1);

    if (conflictRows.length > 0) {
      return res.status(409).json({ error: "Horário indisponível" });
    }

    // 4.5) Validar se paciente existe
    if (!patientId) {
      return res.status(400).json({ error: "patientId é obrigatório" });
    }
    
    const patientRows = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.id, patientId))
      .limit(1);
    
    if (!patientRows || patientRows.length === 0) {
      return res.status(404).json({ error: "patient_not_found" });
    }

    // 5) Pricing usando novo sistema de normalização
    const ct = consultationType || "primeira_consulta";
    const pricingData = getPricingForType(doctor.consultationPricing, ct);
    
    if (!pricingData) {
      return res.status(400).json({
        error: "pricing_not_configured",
        message: "Médico sem preço configurado"
      });
    }
    
    const agreedPriceCents = pricingData.priceCents;
    const { platformFeeCents, doctorEarningsCents } = calcFeesFromCents(agreedPriceCents);
    
    // Converter para string "0.00" para salvar no banco
    const agreedPrice = (agreedPriceCents / 100).toFixed(2);
    const platformFee = (platformFeeCents / 100).toFixed(2);
    const doctorEarnings = (doctorEarningsCents / 100).toFixed(2);

    // 6) Buscar settings para verificar require_prepayment
    const settingsRows = await db
      .select()
      .from(virtualOfficeSettings)
      .where(eq(virtualOfficeSettings.doctorId, doctor.id))
      .limit(1);
    
    const settings = settingsRows?.[0] || null;
    const requirePrepayment = settings?.requirePrepayment ?? true;

    // 7) Inserir consulta (status "pending" sempre, só vai para "scheduled" após pagamento)
    const created = await db
      .insert(consultations)
      .values({
        patientId: patientId,
        doctorId: doctor.id,
        consultationType: ct,
        scheduledFor: scheduledDate,
        chiefComplaint: chiefComplaint || "",
        status: "pending",
        agreedPrice: agreedPrice,
        platformFee: platformFee,
        doctorEarnings: doctorEarnings,
        isMarketplace: false,
        duration: pricingData.duration,
      })
      .returning();

    const consultation = created[0];
    let paymentRecord = null;

    // 8) Se require_prepayment=true, criar payment pendente
    if (requirePrepayment) {
      const paymentCreated = await db
        .insert(payments)
        .values({
          consultationId: consultation.id,
          amount: agreedPrice,
          status: "pending",
          paymentType: "consultation",
        })
        .returning();
      
      paymentRecord = paymentCreated[0];
    } else {
      // Se não exige pagamento, já agenda diretamente
      await db
        .update(consultations)
        .set({ status: "scheduled" })
        .where(eq(consultations.id, consultation.id));
      
      consultation.status = "scheduled";
    }

    return res.status(201).json({
      message: requirePrepayment 
        ? "Consulta criada. Aguardando pagamento para confirmar."
        : "Consulta agendada com sucesso",
      consultation,
      payment: paymentRecord,
      requirePrepayment,
    });
  } catch (error) {
    console.error("Error booking consultation:", error);
    
    // Safety net: mapear FK violation para 404
    if (error?.code === "23503") {
      const detail = String(error?.detail || "").toLowerCase();
      if (detail.includes("patient")) {
        return res.status(404).json({ error: "patient_not_found" });
      }
      if (detail.includes("doctor")) {
        return res.status(404).json({ error: "doctor_not_found" });
      }
    }
    
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

    // 4) Formatar pricing para exibição
    const rawPricing = doctor.consultationPricing;
    const defaultPricing = getPricingForType(rawPricing, "default") || getPricingForType(rawPricing, "primeira_consulta");
    
    let pricingDisplay = null;
    if (defaultPricing) {
      const priceReais = (defaultPricing.priceCents / 100).toFixed(2).replace(".", ",");
      pricingDisplay = {
        raw: rawPricing,
        default: defaultPricing,
        display: `R$ ${priceReais}`
      };
    }

    return res.json({
      doctor: {
        id: doctor.id,
        fullName: user?.fullName || null,
        specialties: doctor.specialties || [],
        bio: doctor.bio || null,
        consultationPricing: doctor.consultationPricing || {},
        availability: doctor.availability || {},
        pricing: pricingDisplay,
      },
      settings: setting,
    });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    return res.status(500).json({ error: "Erro ao carregar consultório" });
  }
});

export default router;
