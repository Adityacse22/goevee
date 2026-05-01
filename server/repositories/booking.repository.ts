import { and, desc, eq, gt, inArray, lt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { bookings, chargers } from '../db/schema.js';
import { AppError } from '../middlewares/error.js';

export type BookingRecord = typeof bookings.$inferSelect;

export interface CreateBookingRecordInput {
  userId: string;
  chargerId: string;
  vehicleId?: string;
  startTime: Date;
  endTime: Date;
  totalPrice?: number;
  bookingReference: string;
}

import crypto from 'node:crypto';

export async function createBooking(input: CreateBookingRecordInput) {
  const [booking] = await db
    .insert(bookings)
    .values({
      id: crypto.randomUUID(),
      userId: input.userId,
      chargerId: input.chargerId,
      vehicleId: input.vehicleId,
      startTime: input.startTime,
      endTime: input.endTime,
      status: 'CONFIRMED',
      totalPrice: input.totalPrice == null ? undefined : String(input.totalPrice),
      bookingReference: input.bookingReference,
    })
    .returning();

  return booking;
}

export async function createBookingWithSafety(
  input: CreateBookingRecordInput,
  bufferMinutes: number,
) {
  const bufferMs = bufferMinutes * 60 * 1000;
  const bufferedStart = new Date(input.startTime.getTime() - bufferMs);
  const bufferedEnd = new Date(input.endTime.getTime() + bufferMs);
  const nextEstimatedAvailableAt = new Date(input.endTime.getTime() + bufferMs);

  return db.transaction(async (tx) => {
    // Check if charger exists in local DB
    const [charger] = await tx
      .select()
      .from(chargers)
      .where(eq(chargers.id, input.chargerId))
      .for('update')
      .limit(1);

    // If it's a local charger, enforce strict rules
    if (charger) {
      if (charger.status === 'OUT_OF_SERVICE' || charger.status === 'MAINTENANCE') {
        throw new AppError(409, 'Charger is not available for booking');
      }

      const [overlap] = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(and(
          eq(bookings.chargerId, input.chargerId),
          inArray(bookings.status, ['PENDING', 'CONFIRMED', 'ACTIVE']),
          lt(bookings.startTime, bufferedEnd),
          gt(bookings.endTime, bufferedStart),
        ))
        .limit(1);

      if (overlap) {
        throw new AppError(409, 'Requested booking window overlaps an existing reservation');
      }
    }

    const [booking] = await tx
      .insert(bookings)
      .values({
        id: crypto.randomUUID(),
        userId: input.userId,
        chargerId: input.chargerId,
        vehicleId: input.vehicleId,
        startTime: input.startTime,
        endTime: input.endTime,
        status: 'CONFIRMED',
        totalPrice: input.totalPrice == null ? undefined : String(input.totalPrice),
        bookingReference: input.bookingReference,
      })
      .returning();

    if (charger) {
      await tx
        .update(chargers)
        .set({
          estimatedAvailableAt: nextEstimatedAvailableAt,
          updatedAt: new Date(),
        })
        .where(eq(chargers.id, input.chargerId));
    }

    return booking;
  });
}

export async function findBookingById(bookingId: string) {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  return booking ?? null;
}

export async function listBookingsByUser(userId: string) {
  return db
    .select()
    .from(bookings)
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.createdAt));
}

export async function cancelBooking(bookingId: string) {
  const [booking] = await db
    .update(bookings)
    .set({
      status: 'CANCELLED',
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  return booking ?? null;
}

export async function findLatestBlockingBooking(chargerId: string) {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(
      eq(bookings.chargerId, chargerId),
      inArray(bookings.status, ['PENDING', 'CONFIRMED', 'ACTIVE']),
    ))
    .orderBy(desc(bookings.endTime))
    .limit(1);

  return booking ?? null;
}
