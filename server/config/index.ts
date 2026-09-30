/**
 * SERVER CONFIG — Environment variables and constants.
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const PORT = Number.parseInt(process.env.PORT ?? '3001', 10);
export const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5433/evee';
export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? '';
export const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? '1d';
export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? '';
export const APP_ORIGIN = process.env.APP_ORIGIN ?? (NODE_ENV === 'production' ? 'https://www.goevee.in' : 'http://localhost:8080');
export const PUBLIC_ORIGIN = 'https://www.goevee.in';
export const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY?.trim() ?? '';
export const TURNSTILE_HOSTNAMES = (process.env.TURNSTILE_HOSTNAMES ?? 'www.goevee.in,goevee.in').split(',').map(host => host.trim()).filter(Boolean);
export const TRUST_PROXY_HOPS = Number(process.env.TRUST_PROXY_HOPS ?? (process.env.VERCEL ? '1' : '0'));
if (!Number.isInteger(TRUST_PROXY_HOPS) || TRUST_PROXY_HOPS < 0 || TRUST_PROXY_HOPS > 5) throw new Error('Invalid TRUST_PROXY_HOPS');
if (NODE_ENV === 'production' && JWT_ACCESS_SECRET.length < 32) throw new Error('JWT_ACCESS_SECRET must contain at least 32 random characters');
export const BCRYPT_SALT_ROUNDS = Number.parseInt(
  process.env.BCRYPT_SALT_ROUNDS ?? '10',
  10,
);
export const BOOKING_BUFFER_MINUTES = Number.parseInt(
  process.env.BOOKING_BUFFER_MINUTES ?? '15',
  10,
);

export const CORS_ORIGINS = Array.from(
  new Set(NODE_ENV === 'production' ? [APP_ORIGIN, PUBLIC_ORIGIN, 'https://goevee.in'] : [APP_ORIGIN, 'http://localhost:8080', 'http://localhost:5173']),
);
