import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { successResponse, errorResponse, created } from '../utils/response.util';

export class AuthController {
  // POST /api/auth/register - Registrar paciente
  async registerPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.registerPatient(req.body);
      return created(res, result, 'Paciente cadastrado com sucesso');
    } catch (error: any) {
      if (error.message === 'Email já cadastrado') {
        return errorResponse(res, error.message, 409);
      }
      next(error);
    }
  }

  // POST /api/auth/register/doctor - Registrar médico
  async registerDoctor(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.registerDoctor(req.body);
      return created(res, result, 'Médico cadastrado com sucesso');
    } catch (error: any) {
      if (error.message.includes('já cadastrado')) {
        return errorResponse(res, error.message, 409);
      }
      next(error);
    }
  }

  // POST /api/auth/login - Login
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      return successResponse(res, result, 'Login realizado com sucesso');
    } catch (error: any) {
      if (error.message === 'Email ou senha incorretos') {
        return errorResponse(res, error.message, 401);
      }
      next(error);
    }
  }

  // GET /api/auth/me - Obter perfil do usuário autenticado
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return errorResponse(res, 'Usuário não autenticado', 401);
      }

      const profile = await authService.getMe(req.user.id);
      return successResponse(res, profile);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
