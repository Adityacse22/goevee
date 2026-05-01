import {
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['USER', 'OPERATOR', 'ADMIN']);

export const stationStatusEnum = pgEnum('station_status', [
  'ACTIVE',
  'INACTIVE',
  'PENDING_APPROVAL',
  'SUSPENDED',
]);

export const chargerStatusEnum = pgEnum('charger_status', [
  'AVAILABLE',
  'OCCUPIED',
  'RESERVED',
  'OUT_OF_SERVICE',
  'MAINTENANCE',
]);

export const bookingStatusEnum = pgEnum('booking_status', [
  'PENDING',
  'CONFIRMED',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
]);

export const sessionStatusEnum = pgEnum('session_status', [
  'PENDING',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
]);

import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').default('USER').notNull(),
  phone: text('phone'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
}));

export const vehicles = pgTable('vehicles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  vehicleName: text('vehicle_name').notNull(),
  brand: text('brand'),
  model: text('model'),
  connectorType: text('connector_type'),
  batteryCapacity: numeric('battery_capacity'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('vehicles_user_id_idx').on(table.userId),
}));

export const stations = pgTable('stations', {
  id: text('id').primaryKey(),
  operatorId: text('operator_id').references(() => users.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  address: text('address').notNull(),
  city: text('city'),
  state: text('state'),
  country: text('country'),
  pincode: text('pincode'),
  latitude: numeric('latitude').notNull(),
  longitude: numeric('longitude').notNull(),
  status: stationStatusEnum('status').default('ACTIVE').notNull(),
  openingTime: time('opening_time'),
  closingTime: time('closing_time'),
  pricingDetails: jsonb('pricing_details'),
  amenities: jsonb('amenities'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  operatorIdx: index('stations_operator_id_idx').on(table.operatorId),
  locationIdx: index('stations_location_idx').on(table.latitude, table.longitude),
}));

export const chargers = pgTable('chargers', {
  id: text('id').primaryKey(),
  stationId: text('station_id').notNull().references(() => stations.id, { onDelete: 'cascade' }),
  chargerCode: text('charger_code').notNull(),
  connectorType: text('connector_type').notNull(),
  powerOutputKw: numeric('power_output_kw').notNull(),
  currentType: text('current_type'),
  status: chargerStatusEnum('status').default('AVAILABLE').notNull(),
  estimatedAvailableAt: timestamp('estimated_available_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  stationIdx: index('chargers_station_id_idx').on(table.stationId),
  stationCodeIdx: uniqueIndex('chargers_station_code_idx').on(table.stationId, table.chargerCode),
}));

export const bookings = pgTable('bookings', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  chargerId: text('charger_id').notNull(), // Removed direct reference to support Google Place IDs
  vehicleId: text('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  status: bookingStatusEnum('status').default('PENDING').notNull(),
  totalPrice: numeric('total_price'),
  bookingReference: text('booking_reference').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  chargerTimeIdx: index('bookings_charger_time_idx').on(
    table.chargerId,
    table.startTime,
    table.endTime,
  ),
  userIdx: index('bookings_user_id_idx').on(table.userId),
  referenceIdx: uniqueIndex('bookings_reference_idx').on(table.bookingReference),
}));

export const chargingSessions = pgTable('charging_sessions', {
  id: text('id').primaryKey(),
  bookingId: text('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  chargerId: text('charger_id').notNull().references(() => chargers.id, { onDelete: 'restrict' }),
  actualStartTime: timestamp('actual_start_time', { withTimezone: true }),
  actualEndTime: timestamp('actual_end_time', { withTimezone: true }),
  energyConsumedKwh: numeric('energy_consumed_kwh'),
  sessionStatus: sessionStatusEnum('session_status').default('PENDING').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  chargerIdx: index('charging_sessions_charger_id_idx').on(table.chargerId),
  bookingIdx: index('charging_sessions_booking_id_idx').on(table.bookingId),
}));

export const favorites = pgTable('favorites', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stationId: text('station_id').notNull().references(() => stations.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userStationIdx: uniqueIndex('favorites_user_station_idx').on(table.userId, table.stationId),
}));

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stationId: text('station_id').notNull().references(() => stations.id, { onDelete: 'cascade' }),
  rating: numeric('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  stationIdx: index('reviews_station_id_idx').on(table.stationId),
}));

export type UserRole = typeof userRoleEnum.enumValues[number];
export type ChargerStatus = typeof chargerStatusEnum.enumValues[number];
export type BookingStatus = typeof bookingStatusEnum.enumValues[number];
