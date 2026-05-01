import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_ACCESS_SECRET } from '../config/index.js';
import type { UserRole } from '../db/schema.js';
import type { AuthUser } from '../types/auth.js';
import { AppError } from './error.js';

type AuthenticatedRequest = Request & { user?: AuthUser };

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';

  if (!token) {
    next(new AppError(401, 'Bearer token is required'));
    return;
  }

  if (!JWT_ACCESS_SECRET.trim()) {
    next(new AppError(500, 'JWT_ACCESS_SECRET is not configured'));
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as AuthUser;

    if (!decoded.userId || !decoded.email || !decoded.role) {
      next(new AppError(401, 'Invalid token payload'));
      return;
    }

    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      next(new AppError(401, 'Authentication is required'));
      return;
    }

    if (!roles.includes(user.role)) {
      next(new AppError(403, 'Insufficient permissions'));
      return;
    }

    next();
  };
}
