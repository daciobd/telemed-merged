import { Request, Response, NextFunction } from 'express';
import patientService from '../services/patient.service';
import { successResponse, errorResponse, notFound } from '../utils/response.util';
import { db } from '../../db';
import { patients } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class PatientController {
  // GET /api/patients/me - Buscar perfil do paciente autenticado
  async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'patient') {
        return errorResponse(res, 'Acesso restrito a pacientes', 403);
      }

      const profile = await patientService.getPatientProfile(req.user.id);
      return successResponse(res, profile);
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        return notFound(res, error.message);
      }
      next(error);
    }
  }

  // PATCH /api/patients/me - Atualizar perfil
  async updateMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'patient') {
        return errorResponse(res, 'Acesso restrito a pacientes', 403);
      }

      const updated = await patientService.updatePatientProfile(req.user.id, req.body);
      return successResponse(res, updated, 'Perfil atualizado com sucesso');
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        return notFound(res, error.message);
      }
      next(error);
    }
  }

  // GET /api/patients/consultations - Buscar consultas do paciente
  async getMyConsultations(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'patient') {
        return errorResponse(res, 'Acesso restrito a pacientes', 403);
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

      const consultations = await patientService.getPatientConsultations(patient.id);
      return successResponse(res, consultations);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/patients/doctors - Buscar médicos do paciente
  async getMyDoctors(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'patient') {
        return errorResponse(res, 'Acesso restrito a pacientes', 403);
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

      const doctors = await patientService.getPatientDoctors(patient.id);
      return successResponse(res, doctors);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/patients/dashboard - Dashboard do paciente
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'patient') {
        return errorResponse(res, 'Acesso restrito a pacientes', 403);
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

      const dashboard = await patientService.getPatientDashboard(patient.id);
      return successResponse(res, dashboard);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/patients/doctors/:doctorId/favorite - Adicionar médico aos favoritos
  async addFavoriteDoctor(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'patient') {
        return errorResponse(res, 'Acesso restrito a pacientes', 403);
      }

      const doctorId = parseInt(req.params.doctorId);

      if (isNaN(doctorId)) {
        return errorResponse(res, 'ID inválido', 400);
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

      const relationship = await patientService.addFavoriteDoctor(patient.id, doctorId);
      return successResponse(res, relationship, 'Médico adicionado aos favoritos');
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/patients/doctors/:doctorId/favorite - Remover dos favoritos
  async removeFavoriteDoctor(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'patient') {
        return errorResponse(res, 'Acesso restrito a pacientes', 403);
      }

      const doctorId = parseInt(req.params.doctorId);

      if (isNaN(doctorId)) {
        return errorResponse(res, 'ID inválido', 400);
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

      await patientService.removeFavoriteDoctor(patient.id, doctorId);
      return successResponse(res, { success: true }, 'Médico removido dos favoritos');
    } catch (error) {
      next(error);
    }
  }
}

export default new PatientController();
