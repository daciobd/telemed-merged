import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

// Middleware genérico de validação
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Erro de validação',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Schemas de validação comuns
export const schemas = {
  // Registro de paciente
  registerPatient: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    fullName: z.string().min(3, 'Nome completo é obrigatório'),
    phone: z.string().optional(),
    cpf: z.string().optional(),
  }),

  // Registro de médico
  registerDoctor: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    fullName: z.string().min(3, 'Nome completo é obrigatório'),
    phone: z.string().optional(),
    cpf: z.string().optional(),
    crm: z.string().min(4, 'CRM é obrigatório'),
    crmState: z.string().length(2, 'Estado do CRM deve ter 2 caracteres'),
    specialties: z.array(z.string()).min(1, 'Pelo menos uma especialidade é obrigatória'),
    accountType: z.enum(['marketplace', 'virtual_office', 'hybrid']).optional(),
  }),

  // Login
  login: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
  }),

  // Criar consulta marketplace
  createMarketplaceConsultation: z.object({
    consultationType: z.enum(['primeira_consulta', 'retorno', 'urgente', 'check_up']),
    patientOffer: z.string().regex(/^\d+(\.\d{2})?$/, 'Valor inválido'),
    chiefComplaint: z.string().min(10, 'Descreva sua queixa com pelo menos 10 caracteres'),
    scheduledFor: z.string().datetime().optional(),
  }),

  // Agendamento direto (consultório)
  createDirectConsultation: z.object({
    doctorId: z.number().int().positive(),
    consultationType: z.enum(['primeira_consulta', 'retorno', 'urgente', 'check_up']),
    scheduledFor: z.string().datetime('Data/hora inválida'),
    chiefComplaint: z.string().min(10, 'Descreva sua queixa').optional(),
  }),

  // Fazer lance
  createBid: z.object({
    bidPrice: z.string().regex(/^\d+(\.\d{2})?$/, 'Valor inválido'),
    message: z.string().max(500).optional(),
  }),

  // Configurar consultório virtual
  updateVirtualOfficeSettings: z.object({
    autoAcceptBookings: z.boolean().optional(),
    requirePrepayment: z.boolean().optional(),
    allowCancellation: z.boolean().optional(),
    cancellationHours: z.number().int().min(0).optional(),
    customBranding: z.object({
      primaryColor: z.string().optional(),
      logo: z.string().url().optional(),
      bannerImage: z.string().url().optional(),
    }).optional(),
    welcomeMessage: z.string().max(500).optional(),
    bookingInstructions: z.string().max(1000).optional(),
    emailNotifications: z.boolean().optional(),
    whatsappNotifications: z.boolean().optional(),
  }),

  // Atualizar perfil do médico
  updateDoctorProfile: z.object({
    fullName: z.string().min(3).optional(),
    phone: z.string().optional(),
    bio: z.string().max(1000).optional(),
    specialties: z.array(z.string()).optional(),
    customUrl: z.string().regex(/^[a-z0-9-]+$/, 'URL deve conter apenas letras minúsculas, números e hífens').optional(),
    consultationPricing: z.object({
      primeira_consulta: z.number().positive().optional(),
      retorno: z.number().positive().optional(),
      urgente: z.number().positive().optional(),
      check_up: z.number().positive().optional(),
    }).optional(),
    availability: z.record(z.array(z.string())).optional(),
    consultationDuration: z.number().int().positive().optional(),
  }),
};
