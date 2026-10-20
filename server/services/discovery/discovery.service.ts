/**
 * Charger discovery pipeline (provider-neutral).
 *
 * search(center, radiusKm):
 *   1. plan circles (≤ 50 km: one circle; 100 km: centre + 8-circle ring);
 *   2. query the centre circle; for 100 km, stop there when it alone proves the
 *      20 nearest stations (saturated, ≥ 20 valid, none could be hidden), else
 *      query the ring with bounded concurrency;
 *   3. normalise, drop records without ID/valid coordinates, drop permanently
 *      closed places, dedupe by provider ID;
 *   4. compute unrounded geodesic distance from the original centre and keep
 *      only distance ≤ radius (the selected radius is never widened or clamped);
 *   5. sort by distance, then by ID for a stable order; cap at 20;
 *   6. report ok / empty / partial and whether closer stations could be missing.
 *
 * A failed centre circle fails the whole search (the closest results would be
 * missing). A failed ring circle yields `partial`.
 */
import {
  geodesicDistanceMeters,
  MAX_STATIONS,
  type AutocompleteResponse,
  type DiscoveryStation,
  type DiscoveryStationDetails,
  type LatLng,
  type RadiusKm,
  type ResolvedLocation,
  type ReverseGeocodeResponse,
  type StationSearchResponse,
} from '../../../shared/discovery.js';
import { planSearchCircles, PROVIDER_MAX_RESULTS, type SearchCircle } from './coverage.js';
import { discoveryError, DiscoveryError } from './errors.js';
import { normalizeGooglePlace, type GooglePlace, type ProviderStation } from './google-normalize.js';
import { DETAILS_FIELD_MASK, RESOLVE_FIELD_MASK, type DiscoveryProviderPort, type GeocodeResult } from './google-places.provider.js';

export interface DiscoveryServiceOptions {
  provider: DiscoveryProviderPort;
  /** Overall budget for one search, below the serverless function timeout. */
  searchDeadlineMs?: number;
  ringConcurrency?: number;
  now?: () => Date;
  log?: (message: string) => void;
}

interface CircleOutcome {
  circle: SearchCircle;
  ok: boolean;
  places: GooglePlace[];
  error?: DiscoveryError;
}

/** Booking needs a verified mapping to GoEvee inventory; no such mapping exists for provider places. */
function withCapability(station: ProviderStation, distanceMeters: number | null): DiscoveryStation {
  const { weekdayHours: _hours, ...rest } = station;
  return { ...rest, distanceMeters, booking: { bookable: false, reason: 'no_verified_inventory' } };
}

async function mapLimit<T, R>(items: T[], limit: number, run: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await run(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Merge step, exported for tests. Returns the sorted, deduplicated, radius-filtered
 * list (uncapped) plus how far each saturated circle's unseen places could reach.
 */
export function mergeCircleResults(center: LatLng, radiusKm: RadiusKm, outcomes: CircleOutcome[], retrievedAt: string) {
  const radiusMeters = radiusKm * 1000;
  const byId = new Map<string, DiscoveryStation>();
  /** For each saturated circle: lower bound on the distance (from `center`) of any place it did not return. */
  const hiddenLowerBounds: number[] = [];
  for (const outcome of outcomes) {
    if (!outcome.ok) continue;
    let farthestFromCircle = 0;
    for (const place of outcome.places) {
      const station = normalizeGooglePlace(place, retrievedAt);
      if (!station) continue;
      farthestFromCircle = Math.max(farthestFromCircle, geodesicDistanceMeters(outcome.circle.center, station.location));
      if (station.operationalStatus === 'permanently_closed') continue;
      const distanceMeters = geodesicDistanceMeters(center, station.location);
      if (!(distanceMeters <= radiusMeters)) continue;
      if (!byId.has(station.id)) byId.set(station.id, withCapability(station, distanceMeters));
    }
    if (outcome.places.length >= PROVIDER_MAX_RESULTS) {
      // Unseen places in this circle are ≥ farthestFromCircle from its centre, so by the
      // triangle inequality ≥ farthestFromCircle − |centre→circle| from the search centre.
      const offset = geodesicDistanceMeters(center, outcome.circle.center);
      hiddenLowerBounds.push(Math.max(0, farthestFromCircle - offset));
    }
  }
  const stations = [...byId.values()].sort((a, b) =>
    (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { stations, hiddenLowerBounds };
}

/** Could a saturated circle hide a station that belongs in the top `MAX_STATIONS`? */
export function mayOmitCloser(sorted: DiscoveryStation[], hiddenLowerBounds: number[]): boolean {
  if (!hiddenLowerBounds.length) return false;
  if (sorted.length < MAX_STATIONS) return true;
  const cutoff = sorted[MAX_STATIONS - 1].distanceMeters ?? 0;
  return hiddenLowerBounds.some(bound => bound < cutoff);
}

const LOCALITY_TYPES = ['sublocality_level_1', 'sublocality', 'neighborhood', 'locality', 'postal_town', 'administrative_area_level_3', 'administrative_area_level_2'];

/** Short "Area, City" label from a reverse-geocode response; null when nothing suitable. */
export function labelFromGeocode(results: GeocodeResult[]): string | null {
  for (const result of results) {
    const components = result.address_components ?? [];
    const find = (type: string) => components.find(component => component.types?.includes(type))?.long_name?.trim();
    const area = find('sublocality_level_1') ?? find('sublocality') ?? find('neighborhood');
    const city = find('locality') ?? find('postal_town') ?? find('administrative_area_level_2');
    const parts = [area, city].filter((part, index, list): part is string => Boolean(part) && list.indexOf(part) === index);
    if (parts.length) return parts.join(', ').slice(0, 120);
  }
  const fallback = results.find(result => result.types?.some(type => LOCALITY_TYPES.includes(type)))?.formatted_address;
  return fallback ? fallback.slice(0, 120) : null;
}

export function createDiscoveryService(options: DiscoveryServiceOptions) {
  const { provider } = options;
  const deadlineMs = options.searchDeadlineMs ?? 9000;
  const ringConcurrency = options.ringConcurrency ?? 4;
  const now = options.now ?? (() => new Date());
  const log = options.log ?? (() => undefined);

  async function queryCircle(circle: SearchCircle, signal: AbortSignal): Promise<CircleOutcome> {
    try {
      const places = await provider.searchNearby({ center: circle.center, radiusMeters: circle.radiusMeters, maxResults: PROVIDER_MAX_RESULTS }, signal);
      return { circle, ok: true, places };
    } catch (error) {
      const failure = error instanceof DiscoveryError ? error : discoveryError('PROVIDER_UNAVAILABLE');
      log(`[discovery] ${circle.role} circle failed: ${failure.code}`);
      return { circle, ok: false, places: [], error: failure };
    }
  }

  async function searchStations(center: LatLng, radiusKm: RadiusKm, callerSignal?: AbortSignal): Promise<StationSearchResponse> {
    const signal = callerSignal ? AbortSignal.any([callerSignal, AbortSignal.timeout(deadlineMs)]) : AbortSignal.timeout(deadlineMs);
    const retrievedAt = now().toISOString();
    const plan = planSearchCircles(center, radiusKm);
    const [centerCircle, ...ring] = plan.circles;

    const outcomes: CircleOutcome[] = [await queryCircle(centerCircle, signal)];
    if (!outcomes[0].ok) throw outcomes[0].error ?? discoveryError('PROVIDER_UNAVAILABLE');

    if (ring.length) {
      const first = mergeCircleResults(center, radiusKm, outcomes, retrievedAt);
      const centreProvesTop = first.stations.length >= MAX_STATIONS && !mayOmitCloser(first.stations, first.hiddenLowerBounds);
      if (!centreProvesTop) outcomes.push(...await mapLimit(ring, ringConcurrency, circle => queryCircle(circle, signal)));
    }

    const { stations, hiddenLowerBounds } = mergeCircleResults(center, radiusKm, outcomes, retrievedAt);
    const failed = outcomes.filter(outcome => !outcome.ok).length;
    const listed = stations.slice(0, MAX_STATIONS);
    return {
      status: failed ? 'partial' : listed.length ? 'ok' : 'empty',
      center,
      radiusKm,
      stations: listed,
      count: listed.length,
      limit: MAX_STATIONS,
      distanceKind: 'straight_line',
      coverage: {
        strategy: plan.strategy,
        circlesPlanned: plan.circles.length,
        circlesQueried: outcomes.length,
        circlesFailed: failed,
        saturatedCircles: hiddenLowerBounds.length,
        mayOmitCloserStations: failed > 0 || mayOmitCloser(stations, hiddenLowerBounds),
      },
      provider: 'google_places',
      retrievedAt,
    };
  }

  async function stationDetails(placeId: string, callerSignal?: AbortSignal): Promise<DiscoveryStationDetails> {
    const signal = callerSignal ? AbortSignal.any([callerSignal, AbortSignal.timeout(deadlineMs)]) : AbortSignal.timeout(deadlineMs);
    const place = await provider.placeDetails(placeId, DETAILS_FIELD_MASK, null, signal);
    const station = normalizeGooglePlace(place, now().toISOString());
    if (!station) throw discoveryError('NOT_FOUND');
    return { ...withCapability(station, null), weekdayHours: station.weekdayHours };
  }

  async function autocomplete(input: { text: string; sessionToken: string; bias: LatLng | null; languageCode: string | null }, callerSignal?: AbortSignal): Promise<AutocompleteResponse> {
    const signal = callerSignal ? AbortSignal.any([callerSignal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000);
    const predictions = await provider.autocomplete(input, signal);
    const suggestions = predictions
      .filter(item => typeof item.placeId === 'string' && /^[A-Za-z0-9_-]{10,300}$/.test(item.placeId) && item.structuredFormat?.mainText?.text)
      .slice(0, 8)
      .map(item => ({
        placeId: item.placeId as string,
        primaryText: (item.structuredFormat?.mainText?.text ?? '').slice(0, 200),
        secondaryText: item.structuredFormat?.secondaryText?.text?.slice(0, 200) ?? null,
        types: Array.isArray(item.types) ? item.types.filter(type => typeof type === 'string').slice(0, 10) : [],
      }));
    return { status: suggestions.length ? 'ok' : 'empty', suggestions };
  }

  async function resolveLocation(placeId: string, sessionToken: string | null, callerSignal?: AbortSignal): Promise<ResolvedLocation> {
    const signal = callerSignal ? AbortSignal.any([callerSignal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000);
    const place = await provider.placeDetails(placeId, RESOLVE_FIELD_MASK, sessionToken, signal);
    const lat = place.location?.latitude;
    const lng = place.location?.longitude;
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw discoveryError('NOT_FOUND');
    }
    return {
      placeId,
      formattedAddress: typeof place.formattedAddress === 'string' ? place.formattedAddress.slice(0, 300) : null,
      location: { lat, lng },
      types: Array.isArray(place.types) ? place.types.slice(0, 10) : [],
    };
  }

  async function reverseGeocode(point: LatLng, callerSignal?: AbortSignal): Promise<ReverseGeocodeResponse> {
    const signal = callerSignal ? AbortSignal.any([callerSignal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000);
    const label = labelFromGeocode(await provider.reverseGeocode(point, signal));
    return { status: label ? 'ok' : 'empty', label };
  }

  return { searchStations, stationDetails, autocomplete, resolveLocation, reverseGeocode };
}

export type DiscoveryService = ReturnType<typeof createDiscoveryService>;
