import { Response } from 'express';

// Interface para resposta de sucesso
interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: any;
  };
}

// Interface para resposta de erro
interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Resposta de sucesso
export const successResponse = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
  meta?: any
) => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  };

  return res.status(statusCode).json(response);
};

// Resposta de erro
export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = 400,
  errors?: Array<{ field: string; message: string }>
) => {
  const response: ErrorResponse = {
    success: false,
    message,
    ...(errors && { errors }),
  };

  return res.status(statusCode).json(response);
};

// Helpers específicos
export const created = <T>(res: Response, data: T, message?: string) => {
  return successResponse(res, data, message, 201);
};

export const noContent = (res: Response) => {
  return res.status(204).send();
};

export const unauthorized = (res: Response, message: string = 'Não autorizado') => {
  return errorResponse(res, message, 401);
};

export const forbidden = (res: Response, message: string = 'Acesso negado') => {
  return errorResponse(res, message, 403);
};

export const notFound = (res: Response, message: string = 'Recurso não encontrado') => {
  return errorResponse(res, message, 404);
};

export const conflict = (res: Response, message: string = 'Conflito de dados') => {
  return errorResponse(res, message, 409);
};

export const serverError = (res: Response, message: string = 'Erro interno do servidor') => {
  return errorResponse(res, message, 500);
};
