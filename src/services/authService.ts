/**
 * SERVICE — Auth data access layer.
 * Pure REST API calls — no state management, no UI logic.
 */

import {
  apiRequest,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from '@/services/apiClient';
import type { AppUser, Profile } from '@/models/auth.model';

interface AuthResponse {
  user: AppUser;
  token: string;
}

interface MeResponse {
  user: AppUser;
}

function toProfile(user: AppUser): Profile {
  return {
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    role: user.role,
    phone: user.phone ?? undefined,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

/** Sign in with email + password. Throws on error. */
export async function signIn(email: string, password: string): Promise<AppUser> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(response.token);
  return response.user;
}

/** Create a new account. Throws on error. */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
): Promise<AppUser> {
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName }),
  });
  setAuthToken(response.token);
  return response.user;
}

/** Sign out the current user. Throws on error. */
export async function signOut(): Promise<void> {
  clearAuthToken();
}

/** Get the current API user from the stored bearer token. */
export async function getCurrentUser(): Promise<AppUser | null> {
  if (!getAuthToken()) return null;

  try {
    const response = await apiRequest<MeResponse>('/auth/me');
    return response.user;
  } catch {
    clearAuthToken();
    return null;
  }
}

/** Fetch the user's profile from the REST API. */
export async function fetchProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  return user ? toProfile(user) : null;
}

export { toProfile };
