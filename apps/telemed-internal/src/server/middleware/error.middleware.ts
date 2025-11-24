import { Request, Response, NextFunction } from 'express';

// Classe customizada de erro
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware de tratamento de erros
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erro interno do servidor';

  // Erro de validação do Drizzle
  if (err.name === 'DrizzleError') {
    statusCode = 400;
    message = 'Erro de validação de dados';
  }

  // Erro de chave duplicada (PostgreSQL)
  if (err.code === '23505') {
    statusCode = 409;
    message = 'Registro já existe';
  }

  // Erro de foreign key (PostgreSQL)
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Referência inválida';
  }

  // Log do erro (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Erro:', err);
  }

  // Resposta ao cliente
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack,
    }),
  });
};

// Helper para criar erros
export const createError = (message: string, statusCode: number) => {
  return new AppError(message, statusCode);
};
