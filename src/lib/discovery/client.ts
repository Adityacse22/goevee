/**
 * Browser client for /api/v1/discovery. No API keys here: the server owns the
 * provider key. Coordinates go in POST bodies, never URLs.
 */
import type {
  AutocompleteResponse,
  DiscoveryErrorCode,
  DiscoveryStationDetails,
  LatLng,
  RadiusKm,
  ResolvedLocation,
  ReverseGeocodeResponse,
  StationSearchResponse,
} from '../../../shared/discovery';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export type DiscoveryFailure = DiscoveryErrorCode | 'OFFLINE' | 'NETWORK' | 'BAD_RESPONSE';

export class DiscoveryRequestError extends Error {
  readonly code: DiscoveryFailure;
  readonly httpStatus: number | null;
  constructor(code: DiscoveryFailure, message: string, httpStatus: number | null = null) {
    super(message);
    this.name = 'DiscoveryRequestError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

const KNOWN_CODES = new Set<DiscoveryErrorCode>(['INVALID_REQUEST', 'RATE_LIMITED', 'NOT_FOUND', 'PROVIDER_TIMEOUT', 'PROVIDER_QUOTA', 'PROVIDER_CONFIG', 'PROVIDER_UNAVAILABLE']);

async function request<T>(path: string, init: RequestInit & { signal?: AbortSignal }): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new DiscoveryRequestError('OFFLINE', 'You’re offline.');
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/discovery${path}`, {
      ...init,
      headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new DiscoveryRequestError(navigator.onLine === false ? 'OFFLINE' : 'NETWORK', 'Couldn’t reach GoEvee.');
  }
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // handled below
  }
  if (!response.ok) {
    const body = (payload ?? {}) as { code?: string; message?: string };
    const code = KNOWN_CODES.has(body.code as DiscoveryErrorCode)
      ? (body.code as DiscoveryErrorCode)
      : response.status === 429 ? 'RATE_LIMITED' : response.status === 404 ? 'NOT_FOUND' : 'PROVIDER_UNAVAILABLE';
    throw new DiscoveryRequestError(code, typeof body.message === 'string' ? body.message : 'Request failed.', response.status);
  }
  if (!payload || typeof payload !== 'object') throw new DiscoveryRequestError('BAD_RESPONSE', 'Unexpected response.', response.status);
  return payload as T;
}

export function searchStations(center: LatLng, radiusKm: RadiusKm, signal?: AbortSignal): Promise<StationSearchResponse> {
  return request<StationSearchResponse>('/stations/search', { method: 'POST', body: JSON.stringify({ lat: center.lat, lng: center.lng, radiusKm }), signal });
}

export async function getStationDetails(stationId: string, signal?: AbortSignal): Promise<DiscoveryStationDetails> {
  const body = await request<{ station: DiscoveryStationDetails }>(`/stations/${encodeURIComponent(stationId)}`, { method: 'GET', signal });
  return body.station;
}

export function autocompleteLocations(input: { input: string; sessionToken: string; bias: LatLng | null }, signal?: AbortSignal): Promise<AutocompleteResponse> {
  return request<AutocompleteResponse>('/autocomplete', {
    method: 'POST',
    body: JSON.stringify({ input: input.input, sessionToken: input.sessionToken, bias: input.bias, languageCode: navigator.language || null }),
    signal,
  });
}

export async function resolveLocation(placeId: string, sessionToken: string | null, signal?: AbortSignal): Promise<ResolvedLocation> {
  const query = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : '';
  const body = await request<{ location: ResolvedLocation }>(`/locations/${encodeURIComponent(placeId)}${query}`, { method: 'GET', signal });
  return body.location;
}

export function reverseGeocode(point: LatLng, signal?: AbortSignal): Promise<ReverseGeocodeResponse> {
  return request<ReverseGeocodeResponse>('/reverse-geocode', { method: 'POST', body: JSON.stringify({ lat: point.lat, lng: point.lng }), signal });
}

export function newSessionToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}
