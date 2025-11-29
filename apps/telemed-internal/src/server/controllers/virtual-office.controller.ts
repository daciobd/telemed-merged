import { Request, Response, NextFunction } from 'express';
import virtualOfficeService from '../services/virtual-office.service';
import { successResponse, errorResponse, notFound } from '../utils/response.util';

export class VirtualOfficeController {
  // GET /api/dr/:customUrl - Página pública do consultório
  async getPublicPage(req: Request, res: Response, next: NextFunction) {
    try {
      const { customUrl } = req.params;

      const pageData = await virtualOfficeService.getPublicPage(customUrl);
      return successResponse(res, pageData);
    } catch (error: any) {
      if (error.message === 'Consultório não encontrado') {
        return notFound(res, error.message);
      }
      next(error);
    }
  }

  // GET /api/virtual-office/settings - Buscar configurações
  async getSettings(req: Request, res: Response, next: NextFunction) {
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

      const settings = await virtualOfficeService.getSettings(doctor.id);
      return successResponse(res, settings);
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/virtual-office/settings - Atualizar configurações
  async updateSettings(req: Request, res: Response, next: NextFunction) {
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

      const updated = await virtualOfficeService.updateSettings(doctor.id, req.body);
      return successResponse(res, updated, 'Configurações atualizadas com sucesso');
    } catch (error: any) {
      if (error.message === 'Configurações não encontradas') {
        return notFound(res, error.message);
      }
      next(error);
    }
  }

  // GET /api/virtual-office/schedule - Buscar agenda
  async getSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'doctor') {
        return errorResponse(res, 'Acesso restrito a médicos', 403);
      }

      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return errorResponse(res, 'Datas de início e fim são obrigatórias', 400);
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

      const schedule = await virtualOfficeService.getSchedule(
        doctor.id,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      return successResponse(res, schedule);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/virtual-office/my-patients - Buscar pacientes do consultório
  async getMyPatients(req: Request, res: Response, next: NextFunction) {
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

      const patients = await virtualOfficeService.getMyPatients(doctor.id);
      return successResponse(res, patients);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/virtual-office/check-availability - Verificar disponibilidade
  async checkAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { doctorId, datetime } = req.body;

      if (!doctorId || !datetime) {
        return errorResponse(res, 'doctorId e datetime são obrigatórios', 400);
      }

      const isAvailable = await virtualOfficeService.checkAvailability(
        doctorId,
        new Date(datetime)
      );

      return successResponse(res, {
        isAvailable,
        datetime,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/virtual-office/:customUrl/book - Agendar consulta direto
  async bookConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const { customUrl } = req.params;
      const { patientId, consultationType, scheduledFor, chiefComplaint } = req.body;

      // Validações
      if (!patientId || !consultationType || !scheduledFor) {
        return errorResponse(res, 'patientId, consultationType e scheduledFor são obrigatórios', 400);
      }

      // Buscar médico por customUrl
      const { db } = await import('../../db');
      const { doctors } = await import('../../db/schema');
      const { eq } = await import('drizzle-orm');

      const [doctor] = await db
        .select()
        .from(doctors)
        .where(eq(doctors.customUrl, customUrl))
        .limit(1);

      if (!doctor) {
        return notFound(res, 'Consultório não encontrado');
      }

      // Importar consultation service para criar a consulta
      const consultationService = (await import('../services/consultation.service')).default;

      const consultation = await consultationService.createDirectConsultation({
        patientId,
        doctorId: doctor.id,
        consultationType,
        scheduledFor,
        chiefComplaint,
      });

      return successResponse(res, consultation, 'Consulta agendada com sucesso no consultório', 201);
    } catch (error: any) {
      if (error.message === 'Consultório não encontrado') {
        return notFound(res, error.message);
      }
      if (error.message.includes('só aceita consultas')) {
        return errorResponse(res, error.message, 400);
      }
      if (error.message === 'Médico não encontrado') {
        return notFound(res, error.message);
      }
      next(error);
    }
  }
}

export default new VirtualOfficeController();
