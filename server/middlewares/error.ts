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
  const parserStatus = (error as Error & { status?: number }).status;
  const statusCode = error instanceof AppError ? error.statusCode : parserStatus === 413 ? 413 : error instanceof SyntaxError && parserStatus === 400 ? 400 : 500;

  res.status(statusCode).json({
    error: statusCode >= 500 && NODE_ENV === 'production' ? 'Something went wrong. Please try again.' : statusCode === 413 ? 'Request body is too large.' : statusCode === 400 && error instanceof SyntaxError ? 'Invalid JSON body.' : error.message || 'Internal server error',
    ...(NODE_ENV === 'production' ? {} : { stack: error.stack }),
  });
}
