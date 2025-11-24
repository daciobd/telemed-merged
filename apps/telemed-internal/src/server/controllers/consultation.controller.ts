import { Request, Response, NextFunction } from 'express';
import consultationService from '../services/consultation.service';
import { successResponse, errorResponse, created, notFound } from '../utils/response.util';
import { db } from '../../db';
import { patients, doctors } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class ConsultationController {
  // POST /api/consultations/marketplace - Criar consulta marketplace
  async createMarketplaceConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'patient') {
        return errorResponse(res, 'Apenas pacientes podem criar consultas', 403);
      }

      // Buscar patientId do usuário autenticado
      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.userId, req.user.id))
        .limit(1);

      if (!patient) {
        return notFound(res, 'Perfil de paciente não encontrado');
      }

      const consultation = await consultationService.createMarketplaceConsultation({
        patientId: patient.id,
        ...req.body,
      });

      return created(res, consultation, 'Consulta criada com sucesso. Aguardando propostas de médicos.');
    } catch (error) {
      next(error);
    }
  }

  // POST /api/consultations/direct - Agendamento direto
  async createDirectConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'patient') {
        return errorResponse(res, 'Apenas pacientes podem agendar consultas', 403);
      }

      // Buscar patientId do usuário autenticado
      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.userId, req.user.id))
        .limit(1);

      if (!patient) {
        return notFound(res, 'Perfil de paciente não encontrado');
      }

      const consultation = await consultationService.createDirectConsultation({
        patientId: patient.id,
        ...req.body,
      });

      return created(res, consultation, 'Consulta agendada com sucesso');
    } catch (error: any) {
      if (error.message === 'Médico não encontrado') {
        return notFound(res, error.message);
      }
      if (error.message.includes('só aceita consultas')) {
        return errorResponse(res, error.message, 400);
      }
      next(error);
    }
  }

  // GET /api/consultations - Listar consultas do usuário autenticado
  async getMyConsultations(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return errorResponse(res, 'Não autenticado', 401);
      }

      let consultations;

      if (req.user.role === 'patient') {
        const [patient] = await db
          .select()
          .from(patients)
          .where(eq(patients.userId, req.user.id))
          .limit(1);

        if (!patient) {
          return notFound(res, 'Perfil de paciente não encontrado');
        }

        consultations = await consultationService.getPatientConsultations(patient.id);
      } else if (req.user.role === 'doctor') {
        const [doctor] = await db
          .select()
          .from(doctors)
          .where(eq(doctors.userId, req.user.id))
          .limit(1);

        if (!doctor) {
          return notFound(res, 'Perfil de médico não encontrado');
        }

        consultations = await consultationService.getDoctorConsultations(doctor.id);
      } else {
        return errorResponse(res, 'Role não suportado', 400);
      }

      return successResponse(res, consultations);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/consultations/marketplace/pending - Consultas pendentes (médicos)
  async getPendingMarketplace(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'doctor') {
        return errorResponse(res, 'Acesso restrito a médicos', 403);
      }

      const consultations = await consultationService.getPendingMarketplaceConsultations();
      return successResponse(res, consultations);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/consultations/:id - Detalhes da consulta
  async getConsultationById(req: Request, res: Response, next: NextFunction) {
    try {
      const consultationId = parseInt(req.params.id);

      if (isNaN(consultationId)) {
        return errorResponse(res, 'ID inválido', 400);
      }

      const consultation = await consultationService.getConsultationById(consultationId);
      return successResponse(res, consultation);
    } catch (error: any) {
      if (error.message === 'Consulta não encontrada') {
        return notFound(res, error.message);
      }
      next(error);
    }
  }

  // PATCH /api/consultations/:id - Atualizar consulta
  async updateConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const consultationId = parseInt(req.params.id);

      if (isNaN(consultationId)) {
        return errorResponse(res, 'ID inválido', 400);
      }

      const updated = await consultationService.updateConsultation(consultationId, req.body);
      return successResponse(res, updated, 'Consulta atualizada com sucesso');
    } catch (error: any) {
      if (error.message === 'Consulta não encontrada') {
        return notFound(res, error.message);
      }
      next(error);
    }
  }

  // DELETE /api/consultations/:id - Cancelar consulta
  async cancelConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const consultationId = parseInt(req.params.id);
      const { reason } = req.body;

      if (isNaN(consultationId)) {
        return errorResponse(res, 'ID inválido', 400);
      }

      if (!reason) {
        return errorResponse(res, 'Motivo do cancelamento é obrigatório', 400);
      }

      const cancelled = await consultationService.cancelConsultation(consultationId, reason);
      return successResponse(res, cancelled, 'Consulta cancelada com sucesso');
    } catch (error: any) {
      if (error.message === 'Consulta não encontrada') {
        return notFound(res, error.message);
      }
      next(error);
    }
  }

  // POST /api/consultations/:id/start - Iniciar consulta
  async startConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const consultationId = parseInt(req.params.id);
      const { meetingUrl } = req.body;

      if (isNaN(consultationId)) {
        return errorResponse(res, 'ID inválido', 400);
      }

      if (!meetingUrl) {
        return errorResponse(res, 'URL da videochamada é obrigatória', 400);
      }

      const started = await consultationService.startConsultation(consultationId, meetingUrl);
      return successResponse(res, started, 'Consulta iniciada');
    } catch (error: any) {
      if (error.message === 'Consulta não encontrada') {
        return notFound(res, error.message);
      }
      next(error);
    }
  }

  // POST /api/consultations/:id/complete - Finalizar consulta
  async completeConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const consultationId = parseInt(req.params.id);

      if (isNaN(consultationId)) {
        return errorResponse(res, 'ID inválido', 400);
      }

      const completed = await consultationService.completeConsultation(consultationId, req.body);
      return successResponse(res, completed, 'Consulta finalizada com sucesso');
    } catch (error: any) {
      if (error.message === 'Consulta não encontrada') {
        return notFound(res, error.message);
      }
      next(error);
    }
  }

  // POST /api/consultations/:id/rate - Avaliar consulta
  async rateConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const consultationId = parseInt(req.params.id);
      const { rating, feedback } = req.body;

      if (isNaN(consultationId)) {
        return errorResponse(res, 'ID inválido', 400);
      }

      if (!rating || rating < 1 || rating > 5) {
        return errorResponse(res, 'Rating deve ser entre 1 e 5', 400);
      }

      const rated = await consultationService.rateConsultation(consultationId, rating, feedback);
      return successResponse(res, rated, 'Avaliação registrada com sucesso');
    } catch (error: any) {
      if (error.message === 'Consulta não encontrada') {
        return notFound(res, error.message);
      }
      next(error);
    }
  }
}

export default new ConsultationController();
