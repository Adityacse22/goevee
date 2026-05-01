import type { UserRole } from '../db/schema.js';

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}
