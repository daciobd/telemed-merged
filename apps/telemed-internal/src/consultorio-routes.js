// Rotas do Consultório Virtual integradas ao telemed-internal
import express from 'express';
import { db } from '../../../db/index.js';
import { users, patients, doctors, consultations, bids, virtualOfficeSettings } from '../../../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { 
  validate, 
  registerPatientSchema, 
  registerDoctorSchema, 
  loginSchema,
  createConsultationSchema,
  updateConsultationSchema,
  createBidSchema,
  updateDoctorSchema
} from './consultorio-validation.js';

const router = express.Router();

// ============================================
// RATE LIMITING
// ============================================

// Rate limiter para autenticação (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 tentativas por IP
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter geral para API
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60, // 60 requisições por minuto
  message: { error: 'Limite de requisições excedido. Tente novamente em breve.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiter geral em todas as rotas
router.use(apiLimiter);

// ============================================
// JWT SECRET VERIFICATION (at router initialization)
// ============================================

if (!process.env.JWT_SECRET) {
  const errorMsg = '❌ ERRO CRÍTICO: JWT_SECRET não configurado para Consultório Virtual!';
  console.error(errorMsg);
  throw new Error('JWT_SECRET environment variable is required. Set JWT_SECRET before starting the application.');
}

// ============================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================================
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// ============================================
// AUTENTICAÇÃO
// ============================================

// POST /api/consultorio/auth/register/patient - Cadastro de paciente
router.post('/auth/register/patient', authLimiter, validate(registerPatientSchema), async (req, res) => {
  try {
    const { email, password, fullName, phone, cpf } = req.validatedBody;
    
    // Verificar se email já existe
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Criar usuário
    const [newUser] = await db.insert(users).values({
      email,
      passwordHash,
      fullName,
      phone,
      cpf,
      role: 'patient',
    }).returning();
    
    // Criar perfil de paciente
    const [patient] = await db.insert(patients).values({
      userId: newUser.id,
    }).returning();
    
    // Gerar token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: 'patient' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
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
    console.error('Erro no cadastro de paciente:', error);
    res.status(500).json({ error: 'Erro ao cadastrar paciente' });
  }
});

// POST /api/consultorio/auth/register/doctor - Cadastro de médico
router.post('/auth/register/doctor', authLimiter, validate(registerDoctorSchema), async (req, res) => {
  try {
    const { email, password, fullName, phone, cpf, crm, crmState, specialties, accountType, customUrl } = req.validatedBody;
    
    // Verificar se email já existe
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    // Verificar se CRM já existe
    const existingCrm = await db.select().from(doctors).where(eq(doctors.crm, crm)).limit(1);
    if (existingCrm.length > 0) {
      return res.status(400).json({ error: 'CRM já cadastrado' });
    }
    
    // Verificar se URL personalizada já existe
    if (customUrl) {
      const existingUrl = await db.select().from(doctors).where(eq(doctors.customUrl, customUrl)).limit(1);
      if (existingUrl.length > 0) {
        return res.status(400).json({ error: 'URL personalizada já está em uso' });
      }
    }
    
    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Criar usuário
    const [newUser] = await db.insert(users).values({
      email,
      passwordHash,
      fullName,
      phone,
      cpf,
      role: 'doctor',
    }).returning();
    
    // Criar perfil de médico
    const [doctor] = await db.insert(doctors).values({
      userId: newUser.id,
      crm,
      crmState,
      specialties: specialties || [],
      accountType: accountType || 'marketplace',
      customUrl: customUrl || null,
      isActive: true,
      isVerified: false,
    }).returning();
    
    // Gerar token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: 'doctor', accountType: doctor.accountType },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
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
    console.error('Erro no cadastro de médico:', error);
    res.status(500).json({ error: 'Erro ao cadastrar médico' });
  }
});

// POST /api/consultorio/auth/login - Login
router.post('/auth/login', authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.validatedBody;
    
    // Buscar usuário
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    
    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }
    
    // Buscar dados adicionais se for médico
    let accountType = null;
    if (user.role === 'doctor') {
      const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, user.id)).limit(1);
      accountType = doctor?.accountType;
    }
    
    // Gerar token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, accountType },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
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
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// GET /api/consultorio/auth/me - Perfil do usuário autenticado
router.get('/auth/me', authenticate, async (req, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    let additionalData = {};
    
    if (user.role === 'doctor') {
      const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, user.id)).limit(1);
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
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// ============================================
// MÉDICOS
// ============================================

// GET /api/consultorio/doctors - Listar médicos
router.get('/doctors', async (req, res) => {
  try {
    const { accountType, speciality } = req.query;
    
    let query = db.select({
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
    console.error('Erro ao listar médicos:', error);
    res.status(500).json({ error: 'Erro ao listar médicos' });
  }
});

// GET /api/consultorio/dr/:customUrl - Página pública do médico
router.get('/dr/:customUrl', async (req, res) => {
  try {
    const { customUrl } = req.params;
    
    const [result] = await db.select({
      id: doctors.id,
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
    
    if (!result) {
      return res.status(404).json({ error: 'Médico não encontrado' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar médico:', error);
    res.status(500).json({ error: 'Erro ao buscar médico' });
  }
});

export default router;
