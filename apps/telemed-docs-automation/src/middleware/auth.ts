import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.header('X-Internal-Token');
  const expectedToken = process.env.INTERNAL_TOKEN || 'change-me-internal';
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Missing X-Internal-Token header',
      code: 'AUTH_MISSING_TOKEN'
    });
  }
  
  if (token !== expectedToken) {
    return res.status(401).json({ 
      error: 'Invalid X-Internal-Token',
      code: 'AUTH_INVALID_TOKEN'
    });
  }
  
  next();
}