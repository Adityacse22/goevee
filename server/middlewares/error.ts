import type { NextFunction, Request, Response } from 'express';
import { NODE_ENV } from '../config/index.js';

export class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  res.status(statusCode).json({
    error: error.message || 'Internal server error',
    ...(NODE_ENV === 'production' ? {} : { stack: error.stack }),
  });
}
