import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

// Extender interface do Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: 'patient' | 'doctor' | 'admin';
        fullName: string;
      };
    }
  }
}

interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Pegar token do header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido',
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Verificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret'
    ) as JwtPayload;

    // Buscar usuário no banco
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    // Adicionar usuário ao request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as 'patient' | 'doctor' | 'admin',
      fullName: user.fullName,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro ao autenticar',
    });
  }
};

// Middleware para verificar se é médico
export const requireDoctor = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'doctor') {
    return res.status(403).json({
      success: false,
      message: 'Acesso restrito a médicos',
    });
  }
  next();
};

// Middleware para verificar se é paciente
export const requirePatient = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'patient') {
    return res.status(403).json({
      success: false,
      message: 'Acesso restrito a pacientes',
    });
  }
  next();
};

// Middleware para verificar se é admin
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso restrito a administradores',
    });
  }
  next();
};
