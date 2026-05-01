/**
 * MODEL — Auth domain types and helpers.
 *
 * Consolidates:
 *   - Profile type         (types/database.ts)
 *   - AuthContextType      (hooks/useAuth.tsx)
 *   - Password strength    (pages/SignUp.tsx lines 75-95)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = 'USER' | 'OPERATOR' | 'ADMIN';

/** Authenticated user returned by the Evee REST API. */
export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** User profile shape consumed by older components. */
export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  role?: UserRole;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

/** Shape of the auth context consumed by components. */
export interface AuthContextType {
  user: AppUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// ─── Password Strength ──────────────────────────────────────────────────────

export type PasswordStrengthLevel = 0 | 1 | 2 | 3;

export const PASSWORD_STRENGTH_LABELS: readonly string[] = [
  'No password',
  'Weak',
  'Medium',
  'Strong',
];

export const PASSWORD_STRENGTH_COLORS: readonly string[] = [
  'bg-transparent',
  'bg-red-500',
  'bg-yellow-500',
  'bg-green-500',
];

export const PASSWORD_STRENGTH_TEXT_COLORS: readonly string[] = [
  '',
  'text-red-400',
  'text-yellow-400',
  'text-green-400',
];

/**
 * Evaluates password strength on a 0-3 scale.
 * (Extracted from SignUp.tsx lines 75-81.)
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthLevel {
  if (password.length === 0) return 0;
  if (password.length < 6) return 1;
  if (password.length < 10) return 2;
  return 3;
}
