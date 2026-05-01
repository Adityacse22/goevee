import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  bookings,
  favorites,
  stations,
  users,
  vehicles,
  type UserRole,
} from '../db/schema.js';

export type UserRecord = typeof users.$inferSelect;

export interface CreateUserInput {
  fullName: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role?: UserRole;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return user ?? null;
}

export async function findUserById(userId: string): Promise<UserRecord | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

import crypto from 'node:crypto';

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  const [user] = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      phone: input.phone,
      role: input.role ?? 'USER',
    })
    .returning();

  return user;
}

export async function updateUserProfile(
  userId: string,
  input: { fullName?: string; phone?: string },
): Promise<UserRecord | null> {
  const [user] = await db
    .update(users)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return user ?? null;
}

export async function createVehicle(
  userId: string,
  input: {
    vehicleName: string;
    brand?: string;
    model?: string;
    connectorType?: string;
    batteryCapacity?: number;
  },
) {
  const [vehicle] = await db
    .insert(vehicles)
    .values({
      id: crypto.randomUUID(),
      userId,
      vehicleName: input.vehicleName,
      brand: input.brand,
      model: input.model,
      connectorType: input.connectorType,
      batteryCapacity: input.batteryCapacity == null ? undefined : String(input.batteryCapacity),
    })
    .returning();

  return vehicle;
}

export async function listVehicles(userId: string) {
  return db.select().from(vehicles).where(eq(vehicles.userId, userId));
}

export async function listUserBookings(userId: string) {
  return db
    .select()
    .from(bookings)
    .where(eq(bookings.userId, userId))
    .orderBy(bookings.startTime);
}

export async function listUserFavorites(userId: string) {
  return db
    .select({
      id: favorites.id,
      createdAt: favorites.createdAt,
      station: stations,
    })
    .from(favorites)
    .innerJoin(stations, eq(favorites.stationId, stations.id))
    .where(eq(favorites.userId, userId));
}
