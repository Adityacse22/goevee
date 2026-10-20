/**
 * GoEvee Explore — availability, freshness and filter logic. Pure functions;
 * every time-dependent helper takes `now` so results are reproducible.
 */
import { calculateDistance } from '../utils/geo';
import { minutesSinceMidnightIST } from './format';
import type {
  AvailabilityLevel,
  BadgeState,
  Connector,
  ConnectorType,
  EvseStatus,
  Filters,
  Freshness,
  Origin,
  PowerTier,
  SortKey,
  Station,
  StationHours,
  Vehicle,
} from './types';

const MINUTE = 60_000;
/** "Live" only while the operator feed is under 2 minutes old. */
export const LIVE_MAX_AGE_MS = 2 * MINUTE;
/** "Updated N min ago" up to 30 minutes; older data is not shown as status. */
export const RECENT_MAX_AGE_MS = 30 * MINUTE;
/** "Available now" refuses data older than 15 minutes. */
export const AVAILABLE_NOW_MAX_AGE_MS = 15 * MINUTE;

const OFFLINE_STATUSES: ReadonlySet<EvseStatus> = new Set(['INOPERATIVE', 'OUTOFORDER']);

/** Default view: no filters. "Available now" is opt-in because most listings publish no live availability. */
export const DEFAULT_FILTERS: Filters = { available: false, connector: null, minKw: null, maxPrice: null };
export const NO_FILTERS: Filters = { available: false, connector: null, minKw: null, maxPrice: null };
export const FAST_MIN_KW = 60;
export const PRICE_CEILING = 15;

export const isFree = (connector: Connector) => connector.status === 'AVAILABLE';
export const isOperational = (connector: Connector) => !OFFLINE_STATUSES.has(connector.status);

export function availableCount(station: Station): number {
  return station.connectors.filter(isFree).length;
}

export function operationalCount(station: Station): number {
  return station.connectors.filter(isOperational).length;
}

/**
 * available: ≥ 2 free and > 25 % free · limited: 1 free or ≤ 25 % free
 * full: none free · offline: no connector is operational.
 */
export function availabilityLevel(station: Station): AvailabilityLevel {
  const total = station.connectors.length;
  if (total === 0 || operationalCount(station) === 0) return 'offline';
  const free = availableCount(station);
  if (free === 0) return 'full';
  if (free === 1 || free / total <= 0.25) return 'limited';
  return 'available';
}

export function maxPowerKw(station: Station): number {
  return station.connectors.reduce((max, connector) => Math.max(max, connector.maxPowerKw), 0);
}

export function powerTier(connector: Pick<Connector, 'current' | 'maxPowerKw'>): PowerTier {
  if (connector.current === 'AC') return 'slow';
  if (connector.maxPowerKw >= 100) return 'ultra';
  if (connector.maxPowerKw >= 60) return 'fast';
  return 'standard';
}

export function dataAgeMs(station: Station, now: number): number {
  return Math.max(0, now - Date.parse(station.lastUpdated));
}

/** The trust contract: never call stale data "Live". */
export function freshness(station: Pick<Station, 'lastUpdated' | 'supportsRealtime'>, now: number): Freshness {
  if (!station.supportsRealtime) return { kind: 'unavailable' };
  const age = Math.max(0, now - Date.parse(station.lastUpdated));
  if (Number.isNaN(age)) return { kind: 'unavailable' };
  if (age < LIVE_MAX_AGE_MS) return { kind: 'live' };
  if (age <= RECENT_MAX_AGE_MS) return { kind: 'recent', minutes: Math.floor(age / MINUTE) };
  return { kind: 'unavailable' };
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Opening hours are evaluated in IST, including overnight ranges. */
export function isOpenNow(hours: StationHours, now: number): boolean {
  if (hours.type === '24x7') return true;
  // Unknown hours (real Google data) never hide a station; TS narrows the rest to the daily shape.
  if (hours.type === 'unknown') return true;
  const current = minutesSinceMidnightIST(now);
  const open = toMinutes(hours.open);
  const close = toMinutes(hours.close);
  if (open === close) return true;
  return open < close ? current >= open && current < close : current >= open || current < close;
}

/**
 * What the availability badge may claim. Stale data never shows a count,
 * and a closed station never looks bookable.
 */
export function badgeState(station: Station, now: number): BadgeState {
  if (freshness(station, now).kind === 'unavailable') return 'unknown';
  const level = availabilityLevel(station);
  if (level === 'offline') return 'offline';
  // Unknown hours resolve to isOpenNow()===true, so an unknown-hours station is never marked 'closed'.
  if (!isOpenNow(station.hours, now)) return 'closed';
  return level;
}

export function priceInclGst(station: Pick<Station, 'pricePerKwh' | 'priceIncludesGst'>): number {
  return station.priceIncludesGst ? station.pricePerKwh : Math.round(station.pricePerKwh * 1.18 * 100) / 100;
}

/** Fast-charge connector used for the vehicle chip: CCS2 for a Nexon EV, LECCS for an Ather. */
const CHIP_PREFERENCE: ConnectorType[] = ['CCS2', 'LECCS', 'CHADEMO', 'BHARAT_DC001', 'TYPE2', 'BHARAT_AC001', 'SOCKET_15A'];

export function chipConnectorFor(vehicle: Pick<Vehicle, 'connectors'> | null | undefined): ConnectorType | null {
  if (!vehicle || vehicle.connectors.length === 0) return null;
  return CHIP_PREFERENCE.find(type => vehicle.connectors.includes(type)) ?? vehicle.connectors[0];
}

function connectorMatches(connector: Connector, filters: Filters): boolean {
  if (filters.available && !isFree(connector)) return false;
  if (filters.connector && connector.type !== filters.connector) return false;
  if (filters.minKw != null && connector.maxPowerKw < filters.minKw) return false;
  return true;
}

/** Station-level gate for "Available now": online, open, and fresh enough to trust. */
export function isTrustworthyNow(station: Station, now: number): boolean {
  if (!station.supportsRealtime) return false;
  if (dataAgeMs(station, now) > AVAILABLE_NOW_MAX_AGE_MS) return false;
  if (availabilityLevel(station) === 'offline') return false;
  return isOpenNow(station.hours, now);
}

/**
 * Combined filters must be satisfied by ONE connector: a single free, compatible
 * connector of at least `minKw` — not a free AC socket plus a busy DC gun.
 */
export function matchesFilters(station: Station, filters: Filters, now: number): boolean {
  if (filters.maxPrice != null && station.priceKnown !== false && priceInclGst(station) >= filters.maxPrice) return false;
  if (filters.available && !isTrustworthyNow(station, now)) return false;
  const needsConnector = filters.available || filters.connector != null || filters.minKw != null;
  return !needsConnector || station.connectors.some(connector => connectorMatches(connector, filters));
}

export function applyFilters(stations: Station[], filters: Filters, now: number): Station[] {
  return stations.filter(station => matchesFilters(station, filters, now));
}

// When a station's price is unknown (priceKnown === false, real Google data),
// priceInclGst still returns the placeholder number, so unknown-price stations
// compare as equal to each other and fall back to the distance tie-breaker in the
// price comparator. No UI selects the price sort for real data — only backward-
// compatible shared links (?sort=price) can reach it.
export function sortStations(stations: Station[], sort: SortKey): Station[] {
  const byDistance = (a: Station, b: Station) => a.distanceKm - b.distanceKm;
  const comparators: Record<SortKey, (a: Station, b: Station) => number> = {
    distance: byDistance,
    price: (a, b) => priceInclGst(a) - priceInclGst(b) || byDistance(a, b),
    power: (a, b) => maxPowerKw(b) - maxPowerKw(a) || byDistance(a, b),
    availability: (a, b) => availableCount(b) - availableCount(a) || byDistance(a, b),
  };
  return [...stations].sort(comparators[sort]);
}

/** Road distance is roughly 1.25× the straight line in Indian cities. */
const ROAD_FACTOR = 1.25;
/** Average urban driving speed used for ETA estimates. */
const CITY_SPEED_KMH = 26;

/** Recomputes distance and ETA from a new origin. The default origin keeps the operator-supplied values. */
export function withOrigin(stations: Station[], origin: Origin): Station[] {
  if (origin.kind === 'default') return stations;
  return stations.map(station => {
    const straight = calculateDistance(origin.coords.lat, origin.coords.lng, station.coords.lat, station.coords.lng);
    const distanceKm = Math.round(straight * ROAD_FACTOR * 10) / 10;
    const etaMin = Math.max(2, Math.round((distanceKm / CITY_SPEED_KMH) * 60));
    return { ...station, distanceKm, etaMin };
  });
}

/**
 * The connector a card should describe: the one satisfying active filters,
 * then the vehicle's compatible connectors, then a free one, then the most powerful.
 */
export function displayConnector(station: Station, filters: Filters, vehicle: Vehicle | null): Connector | undefined {
  const compatible = new Set(vehicle?.connectors ?? []);
  const score = (connector: Connector) => {
    let value = 0;
    if (connectorMatches(connector, filters)) value += 1000;
    if (filters.connector ? connector.type === filters.connector : compatible.has(connector.type)) value += 100;
    if (isFree(connector)) value += 20;
    if (isOperational(connector)) value += 5;
    return value + connector.maxPowerKw / 1000;
  };
  return [...station.connectors].sort((a, b) => score(b) - score(a))[0];
}

export function activeFilterCount(filters: Filters): number {
  return [filters.available, filters.connector != null, filters.minKw != null, filters.maxPrice != null].filter(Boolean).length;
}
