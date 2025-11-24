import { Request, Response, NextFunction } from 'express';
import bidService from '../services/bid.service';
import { successResponse, errorResponse, created, notFound } from '../utils/response.util';
import { db } from '../../db';
import { doctors, patients } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class BidController {
  // POST /api/consultations/:id/bid - Fazer lance
  async createBid(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'doctor') {
        return errorResponse(res, 'Apenas médicos podem fazer lances', 403);
      }

      const consultationId = parseInt(req.params.id);

      if (isNaN(consultationId)) {
        return errorResponse(res, 'ID inválido', 400);
      }

      // Buscar doctorId do usuário autenticado
      const [doctor] = await db
        .select()
        .from(doctors)
        .where(eq(doctors.userId, req.user.id))
        .limit(1);

      if (!doctor) {
        return notFound(res, 'Perfil de médico não encontrado');
      }

      const bid = await bidService.createBid({
        consultationId,
        doctorId: doctor.id,
        ...req.body,
      });

      return created(res, bid, 'Lance enviado com sucesso');
    } catch (error: any) {
      if (error.message.includes('não encontrada')) {
        return notFound(res, error.message);
      }
      if (
        error.message.includes('não está mais aceitando') ||
        error.message.includes('já fez um lance') ||
        error.message.includes('não é do marketplace')
      ) {
        return errorResponse(res, error.message, 400);
      }
      next(error);
    }
  }

  // GET /api/consultations/:id/bids - Listar lances
  async getConsultationBids(req: Request, res: Response, next: NextFunction) {
    try {
      const consultationId = parseInt(req.params.id);

      if (isNaN(consultationId)) {
        return errorResponse(res, 'ID inválido', 400);
      }

      const bids = await bidService.getConsultationBids(consultationId);
      return successResponse(res, bids);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/consultations/:consultationId/accept-bid/:bidId - Aceitar lance
  async acceptBid(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'patient') {
        return errorResponse(res, 'Apenas pacientes podem aceitar lances', 403);
      }

      const consultationId = parseInt(req.params.consultationId);
      const bidId = parseInt(req.params.bidId);

      if (isNaN(consultationId) || isNaN(bidId)) {
        return errorResponse(res, 'IDs inválidos', 400);
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

      const result = await bidService.acceptBid(bidId, consultationId, patient.id);
      return successResponse(res, result, 'Lance aceito! Consulta agendada.');
    } catch (error: any) {
      if (error.message.includes('não encontrad')) {
        return notFound(res, error.message);
      }
      if (
        error.message.includes('não tem permissão') ||
        error.message.includes('não está mais aceitando')
      ) {
        return errorResponse(res, error.message, 400);
      }
      next(error);
    }
  }

  // DELETE /api/bids/:id - Rejeitar/cancelar lance
  async rejectBid(req: Request, res: Response, next: NextFunction) {
    try {
      const bidId = parseInt(req.params.id);

      if (isNaN(bidId)) {
        return errorResponse(res, 'ID inválido', 400);
      }

      const rejected = await bidService.rejectBid(bidId);
      return successResponse(res, rejected, 'Lance rejeitado');
    } catch (error: any) {
      if (error.message === 'Lance não encontrado') {
        return notFound(res, error.message);
      }
      next(error);
    }
  }

  // GET /api/bids/my-bids - Buscar meus lances (médico)
  async getMyBids(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'doctor') {
        return errorResponse(res, 'Acesso restrito a médicos', 403);
      }

      // Buscar doctorId do usuário autenticado
      const [doctor] = await db
        .select()
        .from(doctors)
        .where(eq(doctors.userId, req.user.id))
        .limit(1);

      if (!doctor) {
        return notFound(res, 'Perfil de médico não encontrado');
      }

      const bids = await bidService.getDoctorBids(doctor.id);
      return successResponse(res, bids);
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/bids/:id - Atualizar lance (contra-proposta)
  async updateBid(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'doctor') {
        return errorResponse(res, 'Apenas médicos podem atualizar lances', 403);
      }

      const bidId = parseInt(req.params.id);

      if (isNaN(bidId)) {
        return errorResponse(res, 'ID inválido', 400);
      }

      // Buscar doctorId do usuário autenticado
      const [doctor] = await db
        .select()
        .from(doctors)
        .where(eq(doctors.userId, req.user.id))
        .limit(1);

      if (!doctor) {
        return notFound(res, 'Perfil de médico não encontrado');
      }

      const { bidPrice, message } = req.body;

      if (!bidPrice) {
        return errorResponse(res, 'Novo preço é obrigatório', 400);
      }

      const updated = await bidService.updateBid(bidId, doctor.id, bidPrice, message);
      return successResponse(res, updated, 'Lance atualizado com sucesso');
    } catch (error: any) {
      if (error.message.includes('não encontrado') || error.message.includes('não tem permissão')) {
        return notFound(res, error.message);
      }
      if (error.message.includes('já foi')) {
        return errorResponse(res, error.message, 400);
      }
      next(error);
    }
  }
}

export default new BidController();
