import { Request, Response, NextFunction } from 'express';

export const internalTokenAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const internalToken = req.headers['x-internal-token'];
  
  // Verificar token interno (para sistemas/monitoramento)
  if (internalToken && internalToken === process.env.INTERNAL_TOKEN) {
    // Token interno válido - acesso total como admin
    (req as any).user = {
      id: 0,
      email: 'system@telemed',
      role: 'admin',
      fullName: 'Sistema Interno'
    };
    return next();
  }
  
  // Se não tiver token interno, passa para o próximo middleware
  // (que provavelmente é o authenticate normal)
  next();
};

// Middleware que aceita OU token interno OU autenticação normal
export const flexibleAuth = [
  internalTokenAuth,
  // O middleware authenticate normal vem depois
];
