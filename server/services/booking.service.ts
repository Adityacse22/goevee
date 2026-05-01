import type { AuthUser } from '../types/auth.js';
import { BOOKING_BUFFER_MINUTES } from '../config/index.js';
import { AppError } from '../middlewares/error.js';
import * as bookingRepository from '../repositories/booking.repository.js';
import type { CreateBookingInput } from '../validators/booking.validator.js';

function bookingReference(): string {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `EV-${Date.now()}-${suffix}`;
}

export async function createBooking(input: CreateBookingInput, user: AuthUser) {
  const startTime = new Date(input.startTime);
  const endTime = new Date(input.endTime);
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new AppError(400, 'startTime and endTime must be valid ISO date strings');
  }

  if (startTime >= endTime) {
    throw new AppError(400, 'endTime must be after startTime');
  }

  return bookingRepository.createBookingWithSafety(
    {
      userId: user.userId,
      chargerId: input.chargerId,
      vehicleId: input.vehicleId,
      startTime,
      endTime,
      totalPrice: input.totalPrice,
      bookingReference: bookingReference(),
    },
    BOOKING_BUFFER_MINUTES,
  );
}

export async function getBooking(bookingId: string, user: AuthUser) {
  const booking = await bookingRepository.findBookingById(bookingId);
  if (!booking) throw new AppError(404, 'Booking not found');

  if (user.role !== 'ADMIN' && booking.userId !== user.userId) {
    throw new AppError(403, 'You can only access your own bookings');
  }

  return booking;
}

export async function listMyBookings(user: AuthUser) {
  return bookingRepository.listBookingsByUser(user.userId);
}

export async function cancelBooking(bookingId: string, user: AuthUser) {
  const booking = await getBooking(bookingId, user);

  if (booking.status === 'CANCELLED') {
    return booking;
  }

  return bookingRepository.cancelBooking(bookingId);
}
