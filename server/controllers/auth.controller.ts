import type { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import type { AuthUser } from '../types/auth.js';

type AuthenticatedRequest = Request & { user?: AuthUser };

export async function registerController(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}

export async function loginController(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body);
  res.json(result);
}

export async function meController(req: Request, res: Response): Promise<void> {
  const authUser = (req as AuthenticatedRequest).user!;
  const user = await authService.getCurrentUser(authUser.userId);
  res.json({ user });
}
