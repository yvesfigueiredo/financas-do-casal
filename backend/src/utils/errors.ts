import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiResponse } from "../models/types";

// Classe de erro customizado da aplicação
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Erros conhecidos de negócio
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado(a)`, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422);
  }
}

// Helper para criar respostas de sucesso
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

// Helper para criar respostas de erro
export function errorResponse(error: string): ApiResponse {
  return { success: false, error };
}

// Middleware global de tratamento de erros do Express
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Erro de validação Zod
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    res.status(422).json(errorResponse(messages.join("; ")));
    return;
  }

  // Erro operacional conhecido
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message));
    return;
  }

  // Erro desconhecido - não vazar detalhes em produção
  console.error("Erro inesperado:", err);
  res.status(500).json(errorResponse("Erro interno do servidor"));
}

// Wrapper async para evitar try/catch em controllers
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
