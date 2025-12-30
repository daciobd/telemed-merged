import { Request, Response, NextFunction } from 'express';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  // Simulação simples - aceita qualquer token
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    (req as any).user = {
      id: 1,
      email: 'admin@telemed.com',
      role: 'admin',
      fullName: 'Administrador'
    };
    return next();
  }
  
  // Também aceita token interno
  const internalToken = req.headers['x-internal-token'];
  if (internalToken && internalToken === process.env.INTERNAL_TOKEN) {
    (req as any).user = {
      id: 0,
      email: 'system@telemed',
      role: 'admin',
      fullName: 'Sistema Interno'
    };
    return next();
  }
  
  return res.status(401).json({ error: 'Não autorizado' });
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
};
