/**
 * GoEvee Explore — typed data service. Backed by mock data today; swap the
 * bodies of `fetchStations` / `fetchVehicles` for aggregator API calls later.
 * The last good station snapshot is kept on-device for offline use.
 */
import { searchNearbyEVStations } from '@/services/googleMapsService';
import { MOCK_PLACES, MOCK_VEHICLES, POPULAR_PLACE_IDS, createMockStations } from './mock-data';
import { formatAddress } from './format';
import { adaptEVStation } from './station-adapter';
import type { Origin, Place, Station, Vehicle } from './types';

export interface StationsSnapshot {
  stations: Station[];
  fetchedAt: number;
}

const SNAPSHOT_KEY = 'goevee.stations.v1';
const RECENTS_KEY = 'goevee.recent-searches.v1';
const MAX_RECENTS = 5;

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });

export class OfflineError extends Error {
  constructor() {
    super('You’re offline');
    this.name = 'OfflineError';
  }
}

export async function fetchStations(signal?: AbortSignal): Promise<StationsSnapshot> {
  await wait(320, signal);
  if (!navigator.onLine) throw new OfflineError();
  const snapshot = { stations: createMockStations(Date.now()), fetchedAt: Date.now() };
  saveSnapshot(snapshot);
  return snapshot;
}

export async function fetchVehicles(signal?: AbortSignal): Promise<Vehicle[]> {
  await wait(180, signal);
  return MOCK_VEHICLES.map(vehicle => ({ ...vehicle, connectors: [...vehicle.connectors] }));
}

/**
 * Fetches real nearby stations centered on the active origin via the Google
 * Places (New) service and adapts them to the Explore `Station` shape.
 * Offline is handled explicitly (OfflineError, before touching Google) so the
 * snapshot path takes precedence; Google billing/permission/timeout errors are
 * left to propagate so React Query can surface `isError`/`error.message`
 * (classified for the UI by `classifyExploreError`). Design Section 1.
 */
export async function fetchNearbyStations(
  origin: Origin,
  radiusMeters: number,
  signal?: AbortSignal,
): Promise<StationsSnapshot> {
  if (!navigator.onLine) throw new OfflineError();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const raw = await searchNearbyEVStations(origin.coords.lat, origin.coords.lng, radiusMeters);
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const fetchedAt = Date.now();
  const fetchedAtISO = new Date(fetchedAt).toISOString();
  const stations = raw.map(ev => adaptEVStation(ev, fetchedAtISO));
  const snapshot: StationsSnapshot = { stations, fetchedAt };
  saveSnapshot(snapshot);
  return snapshot;
}

/** Error class the Explore UI distinguishes when a stations fetch fails. */
export type ExploreErrorKind = 'billing' | 'timeout' | 'offline' | 'unknown';

/**
 * Pure classifier mapping a fetch error to a UI-facing kind. Matches the known
 * message prefixes produced by `googleMapsService` (`describePlacesError` /
 * `withTimeout` / the SDK-not-loaded guard). Kept pure (string/instanceof only,
 * no browser globals) so it is unit-testable under `tsx --test`. Design Section 7.
 */
export function classifyExploreError(error: unknown): ExploreErrorKind {
  if (error instanceof OfflineError) return 'offline';
  const name = error instanceof Error ? error.name : '';
  if (name === 'OfflineError') return 'offline';
  const message = error instanceof Error ? error.message : String(error ?? '');
  // Match the known message prefixes produced by googleMapsService.describePlacesError / withTimeout.
  if (/Google rejected the charger search|BillingNotEnabled|PERMISSION_DENIED|has not finished loading/i.test(message)) return 'billing';
  if (/did not respond|timed out|timeout/i.test(message)) return 'timeout';
  return 'unknown';
}

export function saveSnapshot(snapshot: StationsSnapshot): void {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // Storage can be full or blocked; the live list still works.
  }
}

export function loadSnapshot(): StationsSnapshot | undefined {
  try {
    const parsed = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) ?? 'null') as StationsSnapshot | null;
    if (!parsed || !Array.isArray(parsed.stations) || typeof parsed.fetchedAt !== 'number') return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export type SearchSuggestion =
  | { kind: 'place'; id: string; label: string; detail: string; place: Place }
  | { kind: 'station'; id: string; label: string; detail: string; station: Station };

const normalise = (text: string) => text.toLocaleLowerCase('en-IN').normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

export function placeLabel(place: Place): string {
  return `${place.name}, ${place.area}`;
}

export function popularPlaces(): Place[] {
  return POPULAR_PLACE_IDS.map(id => MOCK_PLACES.find(place => place.id === id)).filter((place): place is Place => Boolean(place));
}

/** Local autocomplete over places and stations. Prefix matches rank above substring matches. */
export function searchCatalog(query: string, stations: Station[], limit = 5): SearchSuggestion[] {
  const needle = normalise(query.trim());
  if (!needle) return [];
  const rank = (text: string) => {
    const haystack = normalise(text);
    if (haystack.startsWith(needle)) return 0;
    if (haystack.split(/[\s,–-]+/).some(word => word.startsWith(needle))) return 1;
    return haystack.includes(needle) ? 2 : -1;
  };
  const places = MOCK_PLACES
    .map(place => ({ place, score: rank(placeLabel(place)) }))
    .filter(item => item.score >= 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ place }): SearchSuggestion => ({ kind: 'place', id: `place:${place.id}`, label: place.name, detail: place.area, place }));
  const chargers = stations
    .map(station => ({ station, score: Math.min(...[station.name, formatAddress(station.address)].map(rank).map(s => (s < 0 ? 9 : s))) }))
    .filter(item => item.score < 9)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ station }): SearchSuggestion => ({
      kind: 'station',
      id: `station:${station.id}`,
      label: station.name,
      detail: formatAddress(station.address),
      station,
    }));
  return [...places, ...chargers];
}

export interface RecentSearch {
  id: string;
  label: string;
  detail: string;
  kind: 'place' | 'station';
  /** Place id or station id. */
  ref: string;
}

export function loadRecents(): RecentSearch[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]') as RecentSearch[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

export function saveRecent(entry: RecentSearch): RecentSearch[] {
  const next = [entry, ...loadRecents().filter(item => item.id !== entry.id)].slice(0, MAX_RECENTS);
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    // Recents are a convenience only.
  }
  return next;
}

export function clearRecents(): void {
  try {
    localStorage.removeItem(RECENTS_KEY);
  } catch {
    // Nothing to clear when storage is blocked.
  }
}

export function findPlace(id: string): Place | undefined {
  return MOCK_PLACES.find(place => place.id === id);
}
