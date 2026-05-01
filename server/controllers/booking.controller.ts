import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth.js';
import * as bookingService from '../services/booking.service.js';

type AuthenticatedRequest = Request & { user?: AuthUser };

export async function createBookingController(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user!;
  res.status(201).json({ booking: await bookingService.createBooking(req.body, user) });
}

export async function getBookingController(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user!;
  res.json({ booking: await bookingService.getBooking(String(req.params.bookingId), user) });
}

export async function getMyBookingsController(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user!;
  res.json({ bookings: await bookingService.listMyBookings(user) });
}

export async function cancelBookingController(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user!;
  res.json({
    booking: await bookingService.cancelBooking(String(req.params.bookingId), user),
  });
}
