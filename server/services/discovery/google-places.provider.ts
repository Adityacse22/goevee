/**
 * Google Maps Platform adapter (server-side REST; the key never reaches the browser).
 *
 *   Nearby Search (New)   POST https://places.googleapis.com/v1/places:searchNearby
 *   Autocomplete (New)    POST https://places.googleapis.com/v1/places:autocomplete
 *   Place Details (New)   GET  https://places.googleapis.com/v1/places/{placeId}
 *   Reverse geocoding     GET  https://maps.googleapis.com/maps/api/geocode/json?latlng=
 *
 * Field masks are minimal. Billing note: the nearby/detail masks include
 * evChargeOptions, which Google bills at the "Enterprise + Atmosphere" SKU per
 * request; the location-resolve mask stays on Place Details "Essentials".
 *
 * Every call has a per-attempt timeout, one bounded retry for 429/5xx/network
 * errors (with jitter, only while the caller's deadline allows), and errors are
 * classified into stable codes. Nothing here logs coordinates, queries, or keys.
 */
import { discoveryError, DiscoveryError } from './errors.js';
import type { GooglePlace } from './google-normalize.js';
import type { LatLng } from '../../../shared/discovery.js';

const PLACES_BASE = 'https://places.googleapis.com/v1';
const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

const NEARBY_BASE_FIELDS = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.businessStatus',
  'places.googleMapsUri',
  'places.attributions',
];
/** Default list mask (Enterprise + Atmosphere SKU because of evChargeOptions). */
export const NEARBY_FIELD_MASK = [...NEARBY_BASE_FIELDS, 'places.evChargeOptions'].join(',');
/** List mask without connector data (Nearby Search Pro SKU). */
export const NEARBY_FIELD_MASK_BASIC = NEARBY_BASE_FIELDS.join(',');

export const DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'businessStatus',
  'googleMapsUri',
  'evChargeOptions',
  'attributions',
  'regularOpeningHours.weekdayDescriptions',
].join(',');

export const RESOLVE_FIELD_MASK = 'id,location,formattedAddress,types';

export const AUTOCOMPLETE_FIELD_MASK = [
  'suggestions.placePrediction.placeId',
  'suggestions.placePrediction.structuredFormat',
  'suggestions.placePrediction.types',
].join(',');

export interface NearbyRequest {
  center: LatLng;
  radiusMeters: number;
  maxResults: number;
}

export interface AutocompletePrediction {
  placeId?: string;
  structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
  types?: string[];
}

export interface GeocodeResult {
  formatted_address?: string;
  types?: string[];
  address_components?: Array<{ long_name?: string; short_name?: string; types?: string[] }>;
}

/** Provider port used by the discovery service (swap/mocked in tests). */
export interface DiscoveryProviderPort {
  searchNearby(request: NearbyRequest, signal: AbortSignal): Promise<GooglePlace[]>;
  autocomplete(input: { text: string; sessionToken: string; bias: LatLng | null; languageCode: string | null }, signal: AbortSignal): Promise<AutocompletePrediction[]>;
  placeDetails(placeId: string, fieldMask: string, sessionToken: string | null, signal: AbortSignal): Promise<GooglePlace & { types?: string[] }>;
  reverseGeocode(point: LatLng, signal: AbortSignal): Promise<GeocodeResult[]>;
}

export interface GoogleProviderOptions {
  apiKey: string;
  /** Request connector data in nearby searches (higher SKU). Default true. */
  includeEvChargeOptions?: boolean;
  fetchImpl?: typeof fetch;
  attemptTimeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
}

type Json = Record<string, unknown>;

function classifyHttp(status: number, body: Json | null): DiscoveryError {
  const error = (body?.error ?? {}) as { status?: string; message?: string; details?: Array<{ reason?: string }> };
  const reason = error.details?.find(detail => detail.reason)?.reason ?? '';
  if (status === 429 || error.status === 'RESOURCE_EXHAUSTED') return discoveryError('PROVIDER_QUOTA');
  if (status === 401 || status === 403 || error.status === 'PERMISSION_DENIED' || /API_KEY|BILLING|SERVICE_DISABLED|blocked/i.test(reason)) {
    return discoveryError('PROVIDER_CONFIG');
  }
  if (status === 404 || error.status === 'NOT_FOUND') return discoveryError('NOT_FOUND');
  if (status === 400 && /API key/i.test(error.message ?? '')) return discoveryError('PROVIDER_CONFIG');
  if (status === 400) return discoveryError('INVALID_REQUEST');
  return discoveryError('PROVIDER_UNAVAILABLE');
}

const sleep = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (signal.aborted) { reject(signal.reason); return; }
  const timer = setTimeout(resolve, ms);
  signal.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
});

export function createGooglePlacesProvider(options: GoogleProviderOptions): DiscoveryProviderPort {
  const fetchImpl = options.fetchImpl ?? fetch;
  const attemptTimeoutMs = options.attemptTimeoutMs ?? 5000;
  const maxRetries = options.maxRetries ?? 1;
  const retryBaseDelayMs = options.retryBaseDelayMs ?? 250;

  async function call(url: string, init: RequestInit & { headers: Record<string, string> }, signal: AbortSignal): Promise<Json> {
    if (!options.apiKey) throw discoveryError('PROVIDER_CONFIG');
    let lastError: DiscoveryError = discoveryError('PROVIDER_UNAVAILABLE');
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (signal.aborted) throw discoveryError('PROVIDER_TIMEOUT');
      const attemptSignal = AbortSignal.any([signal, AbortSignal.timeout(attemptTimeoutMs)]);
      try {
        const response = await fetchImpl(url, { ...init, signal: attemptSignal, redirect: 'error' });
        const body = (await response.json().catch(() => null)) as Json | null;
        if (response.ok && body) return body;
        lastError = response.ok ? discoveryError('PROVIDER_UNAVAILABLE') : classifyHttp(response.status, body);
        const retryable = response.status === 429 || response.status >= 500;
        if (!retryable) throw lastError;
      } catch (error) {
        if (error instanceof DiscoveryError && !error.retryable) throw error;
        if (error instanceof DiscoveryError) lastError = error;
        else if (signal.aborted) throw discoveryError('PROVIDER_TIMEOUT');
        else if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) lastError = discoveryError('PROVIDER_TIMEOUT');
        else lastError = discoveryError('PROVIDER_UNAVAILABLE');
      }
      if (attempt < maxRetries) {
        const delay = retryBaseDelayMs * 2 ** attempt + Math.floor(Math.random() * retryBaseDelayMs);
        try { await sleep(delay, signal); } catch { throw discoveryError('PROVIDER_TIMEOUT'); }
      }
    }
    throw lastError;
  }

  const placesHeaders = (fieldMask: string): Record<string, string> => ({
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': options.apiKey,
    'X-Goog-FieldMask': fieldMask,
  });

  return {
    async searchNearby({ center, radiusMeters, maxResults }, signal) {
      const body = await call(`${PLACES_BASE}/places:searchNearby`, {
        method: 'POST',
        headers: placesHeaders(options.includeEvChargeOptions === false ? NEARBY_FIELD_MASK_BASIC : NEARBY_FIELD_MASK),
        body: JSON.stringify({
          includedTypes: ['electric_vehicle_charging_station'],
          maxResultCount: maxResults,
          rankPreference: 'DISTANCE',
          locationRestriction: { circle: { center: { latitude: center.lat, longitude: center.lng }, radius: radiusMeters } },
        }),
      }, signal);
      return Array.isArray(body.places) ? (body.places as GooglePlace[]) : [];
    },

    async autocomplete({ text, sessionToken, bias, languageCode }, signal) {
      const request: Json = { input: text, sessionToken, includeQueryPredictions: false };
      if (bias) request.locationBias = { circle: { center: { latitude: bias.lat, longitude: bias.lng }, radius: 50_000 } };
      if (languageCode) request.languageCode = languageCode;
      const body = await call(`${PLACES_BASE}/places:autocomplete`, {
        method: 'POST',
        headers: placesHeaders(AUTOCOMPLETE_FIELD_MASK),
        body: JSON.stringify(request),
      }, signal);
      const suggestions = Array.isArray(body.suggestions) ? (body.suggestions as Array<{ placePrediction?: AutocompletePrediction }>) : [];
      return suggestions.map(item => item.placePrediction).filter((item): item is AutocompletePrediction => Boolean(item));
    },

    async placeDetails(placeId, fieldMask, sessionToken, signal) {
      const query = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : '';
      const body = await call(`${PLACES_BASE}/places/${encodeURIComponent(placeId)}${query}`, {
        method: 'GET',
        headers: { 'X-Goog-Api-Key': options.apiKey, 'X-Goog-FieldMask': fieldMask },
      }, signal);
      return body as GooglePlace & { types?: string[] };
    },

    async reverseGeocode(point, signal) {
      const params = new URLSearchParams({ latlng: `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`, key: options.apiKey });
      const body = await call(`${GEOCODE_URL}?${params.toString()}`, { method: 'GET', headers: {} }, signal);
      const status = typeof body.status === 'string' ? body.status : 'UNKNOWN_ERROR';
      if (status === 'ZERO_RESULTS') return [];
      if (status === 'OVER_QUERY_LIMIT' || status === 'OVER_DAILY_LIMIT') throw discoveryError('PROVIDER_QUOTA');
      if (status === 'REQUEST_DENIED') throw discoveryError('PROVIDER_CONFIG');
      if (status !== 'OK') throw discoveryError('PROVIDER_UNAVAILABLE');
      return Array.isArray(body.results) ? (body.results as GeocodeResult[]) : [];
    },
  };
}
