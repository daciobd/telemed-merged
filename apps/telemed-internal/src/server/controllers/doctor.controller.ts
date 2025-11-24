import { Request, Response, NextFunction } from 'express';
import doctorService from '../services/doctor.service';
import { successResponse, errorResponse, notFound } from '../utils/response.util';

export class DoctorController {
  // GET /api/doctors - Listar médicos
  async getAllDoctors(req: Request, res: Response, next: NextFunction) {
    try {
      const { specialty, accountType } = req.query;

      const doctors = await doctorService.getAllDoctors({
        specialty: specialty as string,
        accountType: accountType as string,
      });

      return successResponse(res, doctors);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/doctors/marketplace - Médicos do marketplace
  async getMarketplaceDoctors(req: Request, res: Response, next: NextFunction) {
    try {
      const { specialty } = req.query;
      const doctors = await doctorService.getMarketplaceDoctors(specialty as string);

      return successResponse(res, doctors);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/doctors/virtual-office - Médicos com consultório
  async getVirtualOfficeDoctors(req: Request, res: Response, next: NextFunction) {
    try {
      const doctors = await doctorService.getVirtualOfficeDoctors();
      return successResponse(res, doctors);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/doctors/:id - Buscar médico por ID
  async getDoctorById(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorId = parseInt(req.params.id);

      if (isNaN(doctorId)) {
        return errorResponse(res, 'ID inválido', 400);
      }

      const doctor = await doctorService.getDoctorById(doctorId);
      return successResponse(res, doctor);
    } catch (error: any) {
      if (error.message === 'Médico não encontrado') {
        return notFound(res, error.message);
      }
      next(error);
    }
  }

  // PATCH /api/doctors/me - Atualizar perfil do médico autenticado
  async updateMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'doctor') {
        return errorResponse(res, 'Acesso restrito a médicos', 403);
      }

      // Buscar doctorId do usuário autenticado
      const { db } = await import('../../db');
      const { doctors } = await import('../../db/schema');
      const { eq } = await import('drizzle-orm');

      const [doctor] = await db
        .select()
        .from(doctors)
        .where(eq(doctors.userId, req.user.id))
        .limit(1);

      if (!doctor) {
        return notFound(res, 'Perfil de médico não encontrado');
      }

      const updated = await doctorService.updateDoctorProfile(doctor.id, req.body);
      return successResponse(res, updated, 'Perfil atualizado com sucesso');
    } catch (error: any) {
      if (error.message === 'URL já está em uso') {
        return errorResponse(res, error.message, 409);
      }
      next(error);
    }
  }

  // GET /api/doctors/check-url/:customUrl - Verificar disponibilidade de URL
  async checkUrlAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { customUrl } = req.params;
      const isAvailable = await doctorService.checkUrlAvailability(customUrl);

      return successResponse(res, {
        customUrl,
        isAvailable,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/doctors/search?q=termo - Buscar médicos
  async searchDoctors(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        return errorResponse(res, 'Termo de busca é obrigatório', 400);
      }

      const results = await doctorService.searchDoctors(q);
      return successResponse(res, results);
    } catch (error) {
      next(error);
    }
  }
}

export default new DoctorController();
