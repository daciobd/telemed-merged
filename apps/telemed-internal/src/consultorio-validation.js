import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

// Auth Validation
export const registerPatientSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  fullName: z.string().min(3, 'Nome completo é obrigatório'),
  phone: z.string().optional(),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos').optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['M', 'F', 'Outro']).optional()
});

export const registerDoctorSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  fullName: z.string().min(3, 'Nome completo é obrigatório'),
  phone: z.string().optional(),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos').optional(),
  // Aceita CRM com ou sem estado separado
  crm: z.string().min(4, 'CRM é obrigatório'),
  crmState: z.string().length(2, 'Estado do CRM inválido').optional(),
  // Aceita especialidade como string ou array
  specialty: z.string().optional(),
  specialties: z.array(z.string()).min(1, 'Ao menos uma especialidade é obrigatória').optional(),
  // Aceita businessModel ou accountType
  businessModel: z.enum(['marketplace', 'virtual_office', 'hybrid']).optional(),
  accountType: z.enum(['marketplace', 'virtual_office', 'hybrid']).optional(),
  customUrl: z.string().regex(/^[a-z0-9-]+$/, 'URL deve conter apenas letras minúsculas, números e hífens').optional(),
  bio: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

// Consultation Validation
export const createConsultationSchema = z.object({
  consultationType: z.enum(['primeira_consulta', 'retorno', 'urgente', 'check_up']),
  isMarketplace: z.boolean().default(true),
  scheduledFor: z.string().optional(),
  patientOffer: z.number().positive('Oferta deve ser positiva').optional(),
  chiefComplaint: z.string().min(10, 'Descreva a queixa principal (mínimo 10 caracteres)'),
  doctorId: z.number().positive().optional()
});

export const updateConsultationSchema = z.object({
  status: z.enum(['pending', 'doctor_matched', 'payment_pending', 'scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  scheduledFor: z.string().optional(),
  clinicalNotes: z.string().optional(),
  diagnosis: z.string().optional(),
  prescription: z.object({
    medications: z.array(z.object({
      name: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      duration: z.string()
    }))
  }).optional()
});

// Bid Validation
export const createBidSchema = z.object({
  consultationId: z.number().int().positive('ID da consulta é obrigatório'),
  bidAmount: z.number().positive('Lance deve ser positivo'),
  message: z.string().optional()
});

// Doctor Update Validation
export const updateDoctorSchema = z.object({
  bio: z.string().optional(),
  customUrl: z.string().min(3).optional(),
  consultationPricing: z.record(z.number().positive()).optional(), // Permite qualquer chave (video, presencial, etc.)
  education: z.array(z.string()).optional(),
  experience: z.array(z.string()).optional(),
  availability: z.array(z.object({
    day: z.number().min(0).max(6),
    slots: z.array(z.string())
  })).optional(),
  consultationDuration: z.number().min(15).max(120).optional(),
  minPriceMarketplace: z.number().positive().optional()
});

// Direct Booking Validation (Virtual Office)
export const directBookingSchema = z.object({
  doctorId: z.number().int().positive('ID do médico é obrigatório'),
  consultationType: z.string().min(1, 'Tipo de consulta é obrigatório'),
  scheduledFor: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, 'Data/hora no formato ISO inválido'),
  chiefComplaint: z.string().optional()
});

// Nova Consulta - Médico cria consulta com dados do paciente
export const createConsultationByDoctorSchema = z.object({
  paciente_nome: z.string().min(2, 'Nome do paciente é obrigatório'),
  paciente_cpf: z.string().optional(),
  paciente_telefone: z.string().optional(),
  datahora: z.string().optional(),
  tipo: z.enum(['primeira_consulta', 'retorno', 'urgente', 'check_up', 'video', 'presencial']).default('primeira_consulta')
});

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedBody = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: (error.errors || []).map(e => ({
            field: (e.path || []).join('.'),
            message: e.message || 'Erro de validação'
          }))
        });
      }
      // Outros erros: passar adiante
      console.error('Validation error:', error);
      return res.status(500).json({ error: 'Erro interno ao validar dados' });
    }
  };
};
