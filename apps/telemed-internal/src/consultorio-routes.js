import express from "express";

// Importa o módulo CommonJS do db e normaliza para uma constante `db`
import dbModule from "../../../db/index.js";
import * as schema from "../../../db/schema.cjs";

import { eq, and, desc, sql, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import {
  validate,
  registerPatientSchema,
  registerDoctorSchema,
  loginSchema,
  createConsultationSchema,
  updateConsultationSchema,
  createBidSchema,
  updateDoctorSchema,
  directBookingSchema,
} from "./consultorio-validation.js";

// Compatibilidade CJS/ESM: tenta achar o objeto de conexão do Drizzle
const db = dbModule.db || dbModule.default || dbModule;

// Mantém os mesmos nomes das tabelas usados no resto do arquivo
const {
  users,
  patients,
  doctors,
  consultations,
  bids,
  virtualOfficeSettings,
  payments,
  subscriptions,
  notifications,
  patientDoctorRelationships,
} = schema;

const router = express.Router();

// ============================================
// RATE LIMITING
// ============================================

// Rate limiter para autenticação (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 tentativas por IP
  message: { error: "Muitas tentativas. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter geral para API
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60, // 60 requisições por minuto
  message: {
    error: "Limite de requisições excedido. Tente novamente em breve.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiter geral em todas as rotas
router.use(apiLimiter);

// ============================================
// JWT SECRET VERIFICATION (at router initialization)
// ============================================

if (!process.env.JWT_SECRET) {
  const errorMsg =
    "❌ ERRO CRÍTICO: JWT_SECRET não configurado para Consultório Virtual!";
  console.error(errorMsg);
  throw new Error(
    "JWT_SECRET environment variable is required. Set JWT_SECRET before starting the application.",
  );
}

// ============================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================================
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }
};

// ============================================
// AUTENTICAÇÃO
// ============================================

// POST /api/consultorio/auth/register/patient - Cadastro de paciente
router.post(
  "/auth/register/patient",
  authLimiter,
  validate(registerPatientSchema),
  async (req, res) => {
    try {
      const { email, password, fullName, phone, cpf } = req.validatedBody;

      // Verificar se email já existe
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(password, 10);

      // Criar usuário
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          passwordHash,
          fullName,
          phone,
          cpf,
          role: "patient",
        })
        .returning();

      // Criar perfil de paciente
      const [patient] = await db
        .insert(patients)
        .values({
          userId: newUser.id,
        })
        .returning();

      // Gerar token
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: "patient" },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
      );

      res.status(201).json({
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
        },
        token,
      });
    } catch (error) {
      console.error("Erro no cadastro de paciente:", error);
      res.status(500).json({ error: "Erro ao cadastrar paciente" });
    }
  },
);

// POST /api/consultorio/auth/register/doctor - Cadastro de médico
router.post(
  "/auth/register/doctor",
  authLimiter,
  validate(registerDoctorSchema),
  async (req, res) => {
    try {
      const data = req.validatedBody;

      // Processar campos flexíveis
      const specialty =
        data.specialty ||
        (data.specialties && data.specialties[0]) ||
        "Clínico Geral";
      const specialties =
        data.specialties ||
        (data.specialty ? [data.specialty] : ["Clínico Geral"]);
      const businessModel =
        data.businessModel || data.accountType || "marketplace";

      // Processar CRM para extrair estado se necessário
      let crm = data.crm;
      let crmState = data.crmState;

      // Se CRM tem formato "12345-SP", separar
      if (crm && crm.includes("-") && !crmState) {
        const parts = crm.split("-");
        crm = parts[0];
        crmState = parts[1];
      }

      // Verificar se email já existe
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      // Verificar se CRM já existe
      const existingCrm = await db
        .select()
        .from(doctors)
        .where(eq(doctors.crm, crm))
        .limit(1);
      if (existingCrm.length > 0) {
        return res.status(400).json({ error: "CRM já cadastrado" });
      }

      // Verificar se URL personalizada já existe
      if (data.customUrl) {
        const existingUrl = await db
          .select()
          .from(doctors)
          .where(eq(doctors.customUrl, data.customUrl))
          .limit(1);
        if (existingUrl.length > 0) {
          return res
            .status(400)
            .json({ error: "URL personalizada já está em uso" });
        }
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Criar usuário
      const [newUser] = await db
        .insert(users)
        .values({
          email: data.email,
          passwordHash,
          fullName: data.fullName,
          phone: data.phone,
          cpf: data.cpf,
          role: "doctor",
        })
        .returning();

      // Criar perfil de médico
      const [doctor] = await db
        .insert(doctors)
        .values({
          userId: newUser.id,
          crm,
          crmState,
          specialties,
          accountType: businessModel,
          customUrl: data.customUrl || null,
          isActive: true,
          isVerified: false,
        })
        .returning();

      // Gerar token
      const token = jwt.sign(
        {
          id: newUser.id,
          email: newUser.email,
          role: "doctor",
          accountType: doctor.accountType,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
      );

      res.status(201).json({
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
          accountType: doctor.accountType,
        },
        token,
      });
    } catch (error) {
      console.error("Erro no cadastro de médico:", error);
      res.status(500).json({ error: "Erro ao cadastrar médico" });
    }
  },
);

// POST /api/consultorio/auth/login - Login
router.post(
  "/auth/login",
  authLimiter,
  validate(loginSchema),
  async (req, res) => {
    try {
      const { email, password } = req.validatedBody;

      // Buscar usuário
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (!user) {
        return res.status(401).json({ error: "Email ou senha incorretos" });
      }

      // Verificar senha
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: "Email ou senha incorretos" });
      }

      // Buscar dados adicionais se for médico
      let accountType = null;
      if (user.role === "doctor") {
        const [doctor] = await db
          .select()
          .from(doctors)
          .where(eq(doctors.userId, user.id))
          .limit(1);
        accountType = doctor?.accountType;
      }

      // Gerar token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, accountType },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          accountType,
        },
        token,
      });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  },
);

// GET /api/consultorio/auth/me - Perfil do usuário autenticado
router.get("/auth/me", authenticate, async (req, res) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    let additionalData = {};

    if (user.role === "doctor") {
      const [doctor] = await db
        .select()
        .from(doctors)
        .where(eq(doctors.userId, user.id))
        .limit(1);
      additionalData = { accountType: doctor?.accountType };
    }

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      ...additionalData,
    });
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    res.status(500).json({ error: "Erro ao buscar perfil" });
  }
});

// ============================================
// MÉDICOS
// ============================================

// GET /api/consultorio/doctors - Listar médicos
router.get("/doctors", async (req, res) => {
  try {
    const { accountType, speciality } = req.query;

    let query = db
      .select({
        id: doctors.id,
        fullName: users.fullName,
        specialties: doctors.specialties,
        accountType: doctors.accountType,
        customUrl: doctors.customUrl,
        rating: doctors.rating,
        totalConsultations: doctors.totalConsultations,
        bio: doctors.bio,
      })
      .from(doctors)
      .innerJoin(users, eq(doctors.userId, users.id))
      .where(eq(doctors.isActive, true));

    const result = await query;
    res.json(result);
  } catch (error) {
    console.error("Erro ao listar médicos:", error);
    res.status(500).json({ error: "Erro ao listar médicos" });
  }
});

// GET /api/consultorio/dr/:customUrl - Página pública do médico
router.get("/dr/:customUrl", async (req, res) => {
  try {
    const { customUrl } = req.params;

    const [doctor] = await db
      .select({
        id: doctors.id,
        userId: doctors.userId,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        profileImage: users.profileImage,
        crm: doctors.crm,
        crmState: doctors.crmState,
        specialties: doctors.specialties,
        accountType: doctors.accountType,
        customUrl: doctors.customUrl,
        consultationPricing: doctors.consultationPricing,
        bio: doctors.bio,
        education: doctors.education,
        experience: doctors.experience,
        rating: doctors.rating,
        totalConsultations: doctors.totalConsultations,
        consultationDuration: doctors.consultationDuration,
      })
      .from(doctors)
      .innerJoin(users, eq(doctors.userId, users.id))
      .where(eq(doctors.customUrl, customUrl))
      .limit(1);

    if (!doctor) {
      return res.status(404).json({ error: "Médico não encontrado" });
    }

    // Buscar settings do consultório virtual
    const [officeSettings] = await db
      .select()
      .from(virtualOfficeSettings)
      .where(eq(virtualOfficeSettings.doctorId, doctor.id))
      .limit(1);

    // Retornar dados no formato esperado pelo frontend
    res.json({
      doctor,
      officeSettings: officeSettings || {
        autoAcceptBookings: false,
        requirePrepayment: false,
        allowCancellation: true,
        emailNotifications: true,
        whatsappNotifications: false,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar médico:", error);
    res.status(500).json({ error: "Erro ao buscar médico" });
  }
});

// ============================================
// CONSULTAS (CONSULTATIONS)
// ============================================

// POST /api/consultorio/consultations - Criar nova consulta
router.post(
  "/consultations",
  authenticate,
  validate(createConsultationSchema),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        consultationType,
        isMarketplace,
        scheduledFor,
        patientOffer,
        chiefComplaint,
        doctorId,
      } = req.validatedBody;

      // Verificar se é paciente
      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.userId, userId))
        .limit(1);
      if (!patient) {
        return res
          .status(403)
          .json({ error: "Apenas pacientes podem criar consultas" });
      }

      // Se não for marketplace, verificar se doctorId foi fornecido
      if (!isMarketplace && !doctorId) {
        return res
          .status(400)
          .json({ error: "doctorId é obrigatório para consultas diretas" });
      }

      // Criar consulta
      const [consultation] = await db
        .insert(consultations)
        .values({
          patientId: patient.id,
          doctorId: doctorId || null,
          consultationType,
          isMarketplace: isMarketplace ?? true,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          patientOffer: patientOffer || null,
          chiefComplaint,
          status: "pending",
        })
        .returning();

      res.status(201).json(consultation);
    } catch (error) {
      console.error("Erro ao criar consulta:", error);
      res.status(500).json({ error: "Erro ao criar consulta" });
    }
  },
);

// GET /api/consultorio/consultations - Listar consultas do usuário
router.get("/consultations", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let result = [];

    if (role === "patient") {
      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.userId, userId))
        .limit(1);
      if (!patient) {
        return res.status(404).json({ error: "Paciente não encontrado" });
      }

      result = await db
        .select()
        .from(consultations)
        .where(eq(consultations.patientId, patient.id))
        .orderBy(desc(consultations.createdAt));
    } else if (role === "doctor") {
      const [doctor] = await db
        .select()
        .from(doctors)
        .where(eq(doctors.userId, userId))
        .limit(1);
      if (!doctor) {
        return res.status(404).json({ error: "Médico não encontrado" });
      }

      result = await db
        .select()
        .from(consultations)
        .where(eq(consultations.doctorId, doctor.id))
        .orderBy(desc(consultations.createdAt));
    }

    res.json(result);
  } catch (error) {
    console.error("Erro ao listar consultas:", error);
    res.status(500).json({ error: "Erro ao listar consultas" });
  }
});

// GET /api/consultorio/consultations/marketplace - Listar consultas disponíveis no marketplace
router.get("/consultations/marketplace", authenticate, async (req, res) => {
  try {
    // Apenas médicos podem ver marketplace
    if (req.user.role !== "doctor") {
      return res
        .status(403)
        .json({ error: "Apenas médicos podem acessar o marketplace" });
    }

    const result = await db
      .select()
      .from(consultations)
      .where(
        and(
          eq(consultations.isMarketplace, true),
          eq(consultations.status, "pending"),
        ),
      )
      .orderBy(desc(consultations.createdAt));

    res.json(result);
  } catch (error) {
    console.error("Erro ao listar marketplace:", error);
    res.status(500).json({ error: "Erro ao listar consultas do marketplace" });
  }
});

// PUT /api/consultorio/consultations/:id - Atualizar consulta
router.put(
  "/consultations/:id",
  authenticate,
  validate(updateConsultationSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.validatedBody;

      // Buscar consulta
      const [consultation] = await db
        .select()
        .from(consultations)
        .where(eq(consultations.id, parseInt(id)))
        .limit(1);
      if (!consultation) {
        return res.status(404).json({ error: "Consulta não encontrada" });
      }

      // Verificar permissão e ownership
      if (req.user.role === "patient") {
        const [patient] = await db
          .select()
          .from(patients)
          .where(eq(patients.userId, userId))
          .limit(1);
        if (!patient) {
          return res.status(404).json({ error: "Paciente não encontrado" });
        }
        if (consultation.patientId !== patient.id) {
          return res
            .status(403)
            .json({ error: "Sem permissão para atualizar esta consulta" });
        }
      } else if (req.user.role === "doctor") {
        const [doctor] = await db
          .select()
          .from(doctors)
          .where(eq(doctors.userId, userId))
          .limit(1);
        if (!doctor) {
          return res.status(404).json({ error: "Médico não encontrado" });
        }
        if (consultation.doctorId !== doctor.id) {
          return res
            .status(403)
            .json({ error: "Sem permissão para atualizar esta consulta" });
        }
      }

      // Atualizar consulta
      const [updated] = await db
        .update(consultations)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(consultations.id, parseInt(id)))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Erro ao atualizar consulta:", error);
      res.status(500).json({ error: "Erro ao atualizar consulta" });
    }
  },
);

// DELETE /api/consultorio/consultations/:id - Cancelar consulta
router.delete("/consultations/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Buscar consulta
    const [consultation] = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, parseInt(id)))
      .limit(1);
    if (!consultation) {
      return res.status(404).json({ error: "Consulta não encontrada" });
    }

    // Verificar permissão (apenas o paciente DONO da consulta pode cancelar)
    if (req.user.role !== "patient") {
      return res
        .status(403)
        .json({ error: "Apenas pacientes podem cancelar consultas" });
    }

    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.userId, userId))
      .limit(1);
    if (!patient) {
      return res.status(404).json({ error: "Paciente não encontrado" });
    }

    if (consultation.patientId !== patient.id) {
      return res
        .status(403)
        .json({ error: "Sem permissão para cancelar esta consulta" });
    }

    // Cancelar consulta
    const [cancelled] = await db
      .update(consultations)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(consultations.id, parseInt(id)))
      .returning();

    res.json(cancelled);
  } catch (error) {
    console.error("Erro ao cancelar consulta:", error);
    res.status(500).json({ error: "Erro ao cancelar consulta" });
  }
});

// ============================================
// LANCES (BIDS)
// ============================================

// POST /api/consultorio/bids - Criar lance para consulta
router.post(
  "/bids",
  authenticate,
  validate(createBidSchema),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { consultationId, bidAmount, message } = req.validatedBody;

      // Verificar se é médico
      const [doctor] = await db
        .select()
        .from(doctors)
        .where(eq(doctors.userId, userId))
        .limit(1);
      if (!doctor) {
        return res
          .status(403)
          .json({ error: "Apenas médicos podem criar lances" });
      }

      // Verificar se consulta existe e está no marketplace
      const [consultation] = await db
        .select()
        .from(consultations)
        .where(eq(consultations.id, consultationId))
        .limit(1);
      if (!consultation) {
        return res.status(404).json({ error: "Consulta não encontrada" });
      }

      if (!consultation.isMarketplace || consultation.status !== "pending") {
        return res
          .status(400)
          .json({ error: "Consulta não disponível para lances" });
      }

      // Criar lance
      const [bid] = await db
        .insert(bids)
        .values({
          consultationId,
          doctorId: doctor.id,
          bidAmount,
          message: message || null,
        })
        .returning();

      res.status(201).json(bid);
    } catch (error) {
      console.error("Erro ao criar lance:", error);
      res.status(500).json({ error: "Erro ao criar lance" });
    }
  },
);

// GET /api/consultorio/bids/consultation/:consultationId - Listar lances de uma consulta
router.get(
  "/bids/consultation/:consultationId",
  authenticate,
  async (req, res) => {
    try {
      const { consultationId } = req.params;
      const userId = req.user.id;

      // Verificar se consulta existe
      const [consultation] = await db
        .select()
        .from(consultations)
        .where(eq(consultations.id, parseInt(consultationId)))
        .limit(1);
      if (!consultation) {
        return res.status(404).json({ error: "Consulta não encontrada" });
      }

      // Verificar permissão
      if (req.user.role === "patient") {
        const [patient] = await db
          .select()
          .from(patients)
          .where(eq(patients.userId, userId))
          .limit(1);
        if (consultation.patientId !== patient?.id) {
          return res
            .status(403)
            .json({ error: "Sem permissão para ver lances desta consulta" });
        }
      }

      // Buscar lances
      const result = await db
        .select()
        .from(bids)
        .where(eq(bids.consultationId, parseInt(consultationId)))
        .orderBy(bids.bidAmount);

      res.json(result);
    } catch (error) {
      console.error("Erro ao listar lances:", error);
      res.status(500).json({ error: "Erro ao listar lances" });
    }
  },
);

// PUT /api/consultorio/bids/:id/accept - Aceitar lance
router.put("/bids/:id/accept", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Buscar lance
    const [bid] = await db
      .select()
      .from(bids)
      .where(eq(bids.id, parseInt(id)))
      .limit(1);
    if (!bid) {
      return res.status(404).json({ error: "Lance não encontrado" });
    }

    // Buscar consulta
    const [consultation] = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, bid.consultationId))
      .limit(1);
    if (!consultation) {
      return res.status(404).json({ error: "Consulta não encontrada" });
    }

    // Verificar se é o paciente DONO da consulta
    if (req.user.role !== "patient") {
      return res
        .status(403)
        .json({ error: "Apenas pacientes podem aceitar lances" });
    }

    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.userId, userId))
      .limit(1);
    if (!patient) {
      return res.status(404).json({ error: "Paciente não encontrado" });
    }

    if (consultation.patientId !== patient.id) {
      return res
        .status(403)
        .json({ error: "Sem permissão para aceitar lances desta consulta" });
    }

    // Calcular fees (20% plataforma, 80% médico)
    const platformFee = parseFloat(bid.bidAmount) * 0.2; // 20% comissão
    const doctorEarnings = parseFloat(bid.bidAmount) - platformFee;

    // Aceitar lance e armazenar valores financeiros
    const [acceptedBid] = await db
      .update(bids)
      .set({
        isAccepted: true,
        platformFee: platformFee.toFixed(2),
        doctorEarnings: doctorEarnings.toFixed(2),
      })
      .where(eq(bids.id, parseInt(id)))
      .returning();

    await db
      .update(consultations)
      .set({
        doctorId: bid.doctorId,
        agreedPrice: bid.bidAmount,
        platformFee: platformFee.toString(),
        doctorEarnings: doctorEarnings.toString(),
        status: "doctor_matched",
        updatedAt: new Date(),
      })
      .where(eq(consultations.id, bid.consultationId));

    res.json(acceptedBid);
  } catch (error) {
    console.error("Erro ao aceitar lance:", error);
    res.status(500).json({ error: "Erro ao aceitar lance" });
  }
});

// ============================================
// UPDATE DE MÉDICO
// ============================================

// PUT /api/consultorio/doctors/me - Atualizar perfil do médico
router.put(
  "/doctors/me",
  authenticate,
  validate(updateDoctorSchema),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const updates = req.validatedBody;

      // Verificar se é médico
      if (req.user.role !== "doctor") {
        return res
          .status(403)
          .json({ error: "Apenas médicos podem atualizar perfil" });
      }

      const [doctor] = await db
        .select()
        .from(doctors)
        .where(eq(doctors.userId, userId))
        .limit(1);
      if (!doctor) {
        return res.status(404).json({ error: "Médico não encontrado" });
      }

      // Atualizar perfil
      const [updated] = await db
        .update(doctors)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(doctors.userId, userId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Erro ao atualizar médico:", error);
      res.status(500).json({ error: "Erro ao atualizar perfil" });
    }
  },
);

// ============================================
// VIRTUAL OFFICE - ENDPOINTS PÚBLICOS
// ============================================

// POST /api/consultorio/consultations/direct - Agendamento direto (sem leilão)
router.post(
  "/consultations/direct",
  authenticate,
  validate(directBookingSchema),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { doctorId, consultationType, scheduledFor, chiefComplaint } =
        req.validatedBody;

      // Verificar se é paciente
      if (req.user.role !== "patient") {
        return res
          .status(403)
          .json({ error: "Apenas pacientes podem agendar consultas" });
      }

      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.userId, userId))
        .limit(1);
      if (!patient) {
        return res.status(404).json({ error: "Paciente não encontrado" });
      }

      // Buscar médico e pricing
      const [doctor] = await db
        .select()
        .from(doctors)
        .where(eq(doctors.id, doctorId))
        .limit(1);
      if (!doctor) {
        return res.status(404).json({ error: "Médico não encontrado" });
      }

      // Calcular preço da consulta
      const pricing = doctor.consultationPricing || {};
      const agreedPrice = pricing[consultationType] || 0;

      // Criar consulta direta
      const [consultation] = await db
        .insert(consultations)
        .values({
          patientId: patient.id,
          doctorId: doctor.id,
          consultationType,
          isMarketplace: false, // Não é marketplace, é agendamento direto
          scheduledFor: new Date(scheduledFor),
          agreedPrice: agreedPrice.toString(),
          status: "scheduled", // Já agendada
          chiefComplaint: chiefComplaint || null,
        })
        .returning();

      res.json(consultation);
    } catch (error) {
      console.error("Erro ao criar agendamento direto:", error);
      res.status(500).json({ error: "Erro ao criar agendamento" });
    }
  },
);

// POST /api/consultorio/virtual-office/check-availability
router.post("/virtual-office/check-availability", async (req, res) => {
  try {
    const { doctorId, datetime } = req.body;

    // Verificar se já existe consulta nesse horário
    const [existingConsultation] = await db
      .select()
      .from(consultations)
      .where(
        and(
          eq(consultations.doctorId, doctorId),
          eq(consultations.scheduledFor, new Date(datetime)),
          ne(consultations.status, "cancelled"),
        ),
      )
      .limit(1);

    res.json({ available: !existingConsultation });
  } catch (error) {
    console.error("Erro ao verificar disponibilidade:", error);
    res.status(500).json({ error: "Erro ao verificar disponibilidade" });
  }
});

// ============================================
// DASHBOARD DO MÉDICO
// ============================================

// GET /api/doctor/dashboard - Dashboard com métricas do médico
router.get("/doctor/dashboard", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar se é médico
    if (req.user.role !== "doctor") {
      return res
        .status(403)
        .json({ error: "Apenas médicos podem acessar dashboard" });
    }

    const [doctor] = await db
      .select()
      .from(doctors)
      .where(eq(doctors.userId, userId))
      .limit(1);
    if (!doctor) {
      return res.status(404).json({ error: "Médico não encontrado" });
    }

    // Contar consultas totais
    const totalConsultations = await db
      .select()
      .from(consultations)
      .where(eq(consultations.doctorId, doctor.id));

    // Calcular receita do mês
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthConsultations = await db
      .select()
      .from(consultations)
      .where(
        and(
          eq(consultations.doctorId, doctor.id),
          sql`scheduled_for >= ${monthStart}`,
          sql`scheduled_for <= ${monthEnd}`,
        ),
      );

    // Somar receita do médico (doctorEarnings)
    const monthRevenue = monthConsultations.reduce((sum, c) => {
      return sum + (parseFloat(c.doctorEarnings) || 0);
    }, 0);

    res.json({
      doctor: {
        fullName: doctor.userId
          ? (
              await db
                .select()
                .from(users)
                .where(eq(users.id, doctor.userId))
                .limit(1)
            )?.[0]?.fullName
          : null,
        accountType: doctor.accountType,
        customUrl: doctor.customUrl,
        totalConsultations: totalConsultations.length,
        monthRevenue: parseFloat(monthRevenue.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    res.status(500).json({ error: "Erro ao carregar dashboard" });
  }
});

// ============================================
// TIPO DE CONTA DO MÉDICO
// ============================================

// PATCH /api/doctor/account-type - Trocar modo (marketplace/virtual_office/hybrid)
router.patch("/doctor/account-type", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountType } = req.body;

    // Validar accountType
    if (!["marketplace", "virtual_office", "hybrid"].includes(accountType)) {
      return res.status(400).json({
        error:
          "accountType inválido. Use: marketplace, virtual_office ou hybrid",
      });
    }

    // Verificar se é médico
    if (req.user.role !== "doctor") {
      return res
        .status(403)
        .json({ error: "Apenas médicos podem alterar tipo de conta" });
    }

    const [doctor] = await db
      .select()
      .from(doctors)
      .where(eq(doctors.userId, userId))
      .limit(1);
    if (!doctor) {
      return res.status(404).json({ error: "Médico não encontrado" });
    }

    // Atualizar accountType
    const [updated] = await db
      .update(doctors)
      .set({ accountType, updatedAt: new Date() })
      .where(eq(doctors.id, doctor.id))
      .returning();

    res.json({
      doctor: {
        accountType: updated.accountType,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar tipo de conta:", error);
    res.status(500).json({ error: "Erro ao atualizar tipo de conta" });
  }
});

export default router;
