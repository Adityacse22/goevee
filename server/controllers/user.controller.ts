import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth.js';
import * as userService from '../services/user.service.js';

type AuthenticatedRequest = Request & { user?: AuthUser };

export async function getProfileController(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user!;
  res.json({ profile: await userService.getProfile(user.userId) });
}

export async function updateProfileController(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user!;
  res.json({ profile: await userService.updateProfile(user.userId, req.body) });
}

export async function createVehicleController(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user!;
  res.status(201).json({ vehicle: await userService.createVehicle(user.userId, req.body) });
}

export async function getUserBookingsController(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user!;
  res.json({ bookings: await userService.listBookings(user.userId) });
}

export async function getUserFavoritesController(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user!;
  res.json({ favorites: await userService.listFavorites(user.userId) });
}
