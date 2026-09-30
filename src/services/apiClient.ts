const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

const TOKEN_STORAGE_KEY = 'evee.jwt';

export function getAuthToken(): string | null {
  try { return window.localStorage.getItem(TOKEN_STORAGE_KEY); } catch { return null; }
}

export function setAuthToken(token: string): void {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  try { window.localStorage.removeItem(TOKEN_STORAGE_KEY); } catch { /* Storage is unavailable. */ }
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {
    throw new ApiError(response.status || 502, 'The service returned an unexpected response. Please try again.');
  }

  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? response.statusText);
  }

  return data as T;
}
