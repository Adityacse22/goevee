/**
 * Browser-test doubles for /api/v1/discovery and the Geolocation/Permissions
 * APIs. The static preview server returns 503 for /api, so every discovery
 * call is answered here. The station-search stub mirrors the server contract:
 * geodesic distance from the centre, radius filter, distance sort, cap of 20.
 */
import type { Page, Route } from '@playwright/test';
import {
  geodesicDistanceMeters,
  type DiscoveryConnector,
  type DiscoveryErrorCode,
  type DiscoveryStation,
  type LocationSuggestion,
  type OperationalStatus,
  type StationSearchResponse,
} from '../../../shared/discovery';

export interface FixtureStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string | null;
  connectors?: DiscoveryConnector[];
  status?: OperationalStatus;
  weekdayHours?: string[] | null;
}

export interface FixturePlace extends LocationSuggestion {
  coords: { lat: number; lng: number };
}

export const PLACES: Record<string, FixturePlace> = {
  connaught: { placeId: 'ChIJ_connaught_place', primaryText: 'Connaught Place', secondaryText: 'New Delhi, Delhi, India', types: ['sublocality'], coords: { lat: 28.6315, lng: 77.2167 } },
  connaughtRoad: { placeId: 'ChIJ_connaught_road1', primaryText: 'Connaught Road', secondaryText: 'Hong Kong', types: ['route'], coords: { lat: 22.2849, lng: 114.1577 } },
  koramangala: { placeId: 'ChIJ_koramangala_blr', primaryText: 'Koramangala', secondaryText: 'Bengaluru, Karnataka, India', types: ['sublocality'], coords: { lat: 12.9352, lng: 77.6245 } },
  pune: { placeId: 'ChIJ_pune_maharashtra', primaryText: 'Pune', secondaryText: 'Maharashtra, India', types: ['locality'], coords: { lat: 18.5204, lng: 73.8567 } },
};

/** Autocomplete fixtures keyed by lower-case prefix. */
export const DEFAULT_AUTOCOMPLETE: Array<[string, FixturePlace[]]> = [
  ['conn', [PLACES.connaught, PLACES.connaughtRoad]],
  ['connaught p', [PLACES.connaught]],
  ['kora', [PLACES.koramangala]],
  ['pune', [PLACES.pune]],
];

export interface SearchCall { lat: number; lng: number; radiusKm: number }

export interface DiscoveryStubOptions {
  stations?: FixtureStation[];
  autocomplete?: Array<[string, FixturePlace[]]>;
  /** Force a failure for station searches. */
  failSearch?: DiscoveryErrorCode;
  /** Mark searches partial (one failed circle). */
  partial?: boolean;
  /** Artificial latency per search request. */
  searchDelayMs?: (call: SearchCall) => number;
  reverseLabel?: string | null;
  failDetails?: DiscoveryErrorCode;
}

export interface DiscoveryStubLog {
  searches: SearchCall[];
  autocompletes: Array<{ input: string; sessionToken: string }>;
  resolves: Array<{ placeId: string; sessionToken: string | null }>;
  details: string[];
}

const RETRIEVED_AT = '2026-09-27T05:12:00.000Z';

export function toDiscoveryStation(fixture: FixtureStation, distanceMeters: number | null): DiscoveryStation {
  return {
    id: fixture.id,
    provider: 'google_places',
    name: fixture.name,
    address: fixture.address === undefined ? `${fixture.name} Road` : fixture.address,
    location: { lat: fixture.lat, lng: fixture.lng },
    distanceMeters,
    operationalStatus: fixture.status ?? 'operational',
    connectors: fixture.connectors ?? [],
    connectorCount: fixture.connectors?.reduce((sum, item) => sum + (item.count ?? 0), 0) || null,
    pricing: { known: false },
    booking: { bookable: false, reason: 'no_verified_inventory' },
    googleMapsUri: `https://maps.google.com/?cid=${fixture.id.length}`,
    attributions: [],
    retrievedAt: RETRIEVED_AT,
  };
}

const errorBody = (code: DiscoveryErrorCode) => ({ status: 'error', code, message: `Stubbed ${code}`, retryable: code !== 'INVALID_REQUEST' });
const errorStatus: Record<DiscoveryErrorCode, number> = { INVALID_REQUEST: 400, NOT_FOUND: 404, RATE_LIMITED: 429, PROVIDER_TIMEOUT: 504, PROVIDER_QUOTA: 503, PROVIDER_CONFIG: 503, PROVIDER_UNAVAILABLE: 502 };

export async function stubDiscovery(page: Page, options: DiscoveryStubOptions = {}): Promise<DiscoveryStubLog> {
  const log: DiscoveryStubLog = { searches: [], autocompletes: [], resolves: [], details: [] };
  const world = options.stations ?? [];
  const autocomplete = options.autocomplete ?? DEFAULT_AUTOCOMPLETE;
  const allPlaces = autocomplete.flatMap(([, places]) => places);
  // The navigate page's Maps SDK is never fetched from the network in tests.
  await page.route('https://maps.googleapis.com/**', route => route.abort());

  await page.route('**/api/v1/discovery/**', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^.*\/api\/v1\/discovery/, '');
    const json = (status: number, body: unknown) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (path === '/stations/search' && request.method() === 'POST') {
      const body = request.postDataJSON() as SearchCall;
      log.searches.push(body);
      const delay = options.searchDelayMs?.(body) ?? 0;
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      if (options.failSearch) return json(errorStatus[options.failSearch], errorBody(options.failSearch));
      const centre = { lat: body.lat, lng: body.lng };
      const matches = world
        .filter(item => item.status !== 'permanently_closed')
        .map(item => ({ item, distance: geodesicDistanceMeters(centre, { lat: item.lat, lng: item.lng }) }))
        .filter(entry => entry.distance <= body.radiusKm * 1000)
        .sort((a, b) => a.distance - b.distance || (a.item.id < b.item.id ? -1 : 1))
        .slice(0, 20)
        .map(entry => toDiscoveryStation(entry.item, entry.distance));
      const response: StationSearchResponse = {
        status: options.partial ? 'partial' : matches.length ? 'ok' : 'empty',
        center: centre,
        radiusKm: body.radiusKm as StationSearchResponse['radiusKm'],
        stations: matches,
        count: matches.length,
        limit: 20,
        distanceKind: 'straight_line',
        coverage: {
          strategy: body.radiusKm > 50 ? 'multi_circle' : 'single_circle',
          circlesPlanned: body.radiusKm > 50 ? 9 : 1,
          circlesQueried: body.radiusKm > 50 ? 9 : 1,
          circlesFailed: options.partial ? 1 : 0,
          saturatedCircles: 0,
          mayOmitCloserStations: Boolean(options.partial),
        },
        provider: 'google_places',
        retrievedAt: RETRIEVED_AT,
      };
      return json(200, response);
    }

    if (path === '/autocomplete' && request.method() === 'POST') {
      const body = request.postDataJSON() as { input: string; sessionToken: string };
      log.autocompletes.push({ input: body.input, sessionToken: body.sessionToken });
      const needle = body.input.trim().toLowerCase();
      const match = [...autocomplete].sort((a, b) => b[0].length - a[0].length).find(([prefix]) => needle.startsWith(prefix));
      const suggestions = (match?.[1] ?? []).map(({ placeId, primaryText, secondaryText, types }) => ({ placeId, primaryText, secondaryText, types }));
      return json(200, { status: suggestions.length ? 'ok' : 'empty', suggestions });
    }

    const location = path.match(/^\/locations\/([^/?]+)$/);
    if (location) {
      const placeId = decodeURIComponent(location[1]);
      log.resolves.push({ placeId, sessionToken: url.searchParams.get('sessionToken') });
      const place = allPlaces.find(item => item.placeId === placeId);
      if (!place) return json(404, errorBody('NOT_FOUND'));
      return json(200, { status: 'ok', location: { placeId, formattedAddress: `${place.primaryText}, ${place.secondaryText}`, location: place.coords, types: place.types } });
    }

    if (path === '/reverse-geocode') {
      const label = options.reverseLabel === undefined ? 'Connaught Place, New Delhi' : options.reverseLabel;
      return json(200, { status: label ? 'ok' : 'empty', label });
    }

    const details = path.match(/^\/stations\/([^/?]+)$/);
    if (details && request.method() === 'GET') {
      const id = decodeURIComponent(details[1]);
      log.details.push(id);
      if (options.failDetails) return json(errorStatus[options.failDetails], errorBody(options.failDetails));
      const fixture = world.find(item => item.id === id);
      if (!fixture) return json(404, errorBody('NOT_FOUND'));
      return json(200, { status: 'ok', station: { ...toDiscoveryStation(fixture, null), weekdayHours: fixture.weekdayHours ?? null } });
    }

    return json(404, errorBody('NOT_FOUND'));
  });
  return log;
}

export type GeoMode =
  | { kind: 'success'; lat: number; lng: number; accuracy?: number; delayMs?: number }
  | { kind: 'denied' | 'unavailable' | 'timeout'; delayMs?: number }
  | { kind: 'unsupported' };

/** Deterministic Geolocation + Permissions API doubles. `window.__geoCalls` counts position requests. */
export async function mockGeolocation(page: Page, mode: GeoMode, permission: 'prompt' | 'granted' | 'denied' = 'prompt') {
  await page.addInitScript(({ mode, permission }) => {
    const w = window as unknown as { __geoCalls: number };
    w.__geoCalls = 0;
    if (mode.kind === 'unsupported') {
      Object.defineProperty(Navigator.prototype, 'geolocation', { configurable: true, get: () => undefined });
      // `'geolocation' in navigator` must be false.
      delete (Navigator.prototype as unknown as Record<string, unknown>).geolocation;
      return;
    }
    const codes = { denied: 1, unavailable: 2, timeout: 3 } as const;
    const geolocation = {
      getCurrentPosition(success: PositionCallback, failure?: PositionErrorCallback | null) {
        w.__geoCalls += 1;
        const delay = 'delayMs' in mode && mode.delayMs ? mode.delayMs : 0;
        setTimeout(() => {
          if (mode.kind === 'success') {
            success({ coords: { latitude: mode.lat, longitude: mode.lng, accuracy: mode.accuracy ?? 25, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() } as GeolocationPosition);
          } else {
            failure?.({ code: codes[mode.kind], message: mode.kind, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
          }
        }, delay);
      },
      watchPosition: () => 0,
      clearWatch: () => undefined,
    };
    Object.defineProperty(Navigator.prototype, 'geolocation', { configurable: true, get: () => geolocation });
    const originalQuery = navigator.permissions?.query?.bind(navigator.permissions);
    if (navigator.permissions) {
      navigator.permissions.query = ((descriptor: PermissionDescriptor) => descriptor.name === 'geolocation'
        ? Promise.resolve({ state: permission, name: 'geolocation', onchange: null, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false } as unknown as PermissionStatus)
        : originalQuery!(descriptor)) as Permissions['query'];
    }
  }, { mode, permission });
}

/** Restores a previously chosen place (sessionStorage), as after a reload. */
export async function seedPlace(page: Page, place: FixturePlace) {
  await page.addInitScript(value => {
    if (!sessionStorage.getItem('goevee.search-center.v1')) sessionStorage.setItem('goevee.search-center.v1', JSON.stringify(value));
  }, { source: 'place', label: place.primaryText, secondaryLabel: place.secondaryText, placeId: place.placeId, coords: place.coords });
}

/** Station `km` east of `origin` (WGS84 geodesic, close enough for fixtures). */
export function eastOf(origin: { lat: number; lng: number }, km: number) {
  const metresPerDegree = 111_320 * Math.cos((origin.lat * Math.PI) / 180);
  let lng = origin.lng + (km * 1000) / metresPerDegree;
  // Refine against the geodesic used by the app.
  for (let i = 0; i < 5; i++) lng = origin.lng + (lng - origin.lng) * ((km * 1000) / geodesicDistanceMeters(origin, { lat: origin.lat, lng }));
  return { lat: origin.lat, lng };
}

export const ccs2 = (count: number, availableCount: number | null, maxPowerKw: number | null = 60): DiscoveryConnector => ({
  kind: 'CCS2', maxPowerKw, count, availableCount, outOfServiceCount: availableCount == null ? null : 0, availabilityUpdatedAt: availableCount == null ? null : RETRIEVED_AT,
});
