/**
 * Charger discovery — contract shared by the API (server/) and the web app (src/).
 *
 * Pure and dependency-free so both sides (and node:test) use the same
 * geodesy, radius rules, and Google Maps hand-off URL.
 *
 * Data-honesty rules encoded in these types:
 *  - Unknown is `null` (never 0, never "free", never "available").
 *  - Distances are straight-line (geodesic) metres, unrounded. They are NOT
 *    driving distances; the UI must label them as approximate straight-line.
 *  - A discovered station is bookable only when it maps to verified GoEvee
 *    inventory. Provider results never are.
 */

// ---------------------------------------------------------------------------
// Radius and result limits
// ---------------------------------------------------------------------------

export const RADIUS_OPTIONS_KM = [10, 20, 30, 50, 100] as const;
export type RadiusKm = (typeof RADIUS_OPTIONS_KM)[number];
export const DEFAULT_RADIUS_KM: RadiusKm = 10;
/** Maximum stations returned to the client for one search. */
export const MAX_STATIONS = 20;

export function isRadiusKm(value: unknown): value is RadiusKm {
  return typeof value === 'number' && (RADIUS_OPTIONS_KM as readonly number[]).includes(value);
}

/** Parses a radius from a URL/query value; anything outside the fixed set returns null (never clamped). */
export function parseRadiusKm(value: unknown): RadiusKm | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (typeof value === 'string' && !/^\d{1,3}$/.test(value.trim())) return null;
  const parsed = Number(value);
  return isRadiusKm(parsed) ? parsed : null;
}

// ---------------------------------------------------------------------------
// Geodesy
// ---------------------------------------------------------------------------

export interface LatLng {
  lat: number;
  lng: number;
}

export function isValidLatLng(value: unknown): value is LatLng {
  if (!value || typeof value !== 'object') return false;
  const { lat, lng } = value as Record<string, unknown>;
  return typeof lat === 'number' && typeof lng === 'number'
    && Number.isFinite(lat) && Number.isFinite(lng)
    && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Wraps any longitude into [-180, 180). Handles date-line crossings. */
export function normalizeLongitude(lng: number): number {
  const wrapped = ((((lng + 180) % 360) + 360) % 360) - 180;
  return Object.is(wrapped, -0) ? 0 : wrapped;
}

/** IUGG mean Earth radius (metres) for spherical formulas. */
export const MEAN_EARTH_RADIUS_M = 6_371_008.8;

/** Great-circle distance on a sphere (metres). Error vs. WGS84 is up to ~0.5 %. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(normalizeLongitude(b.lng - a.lng));
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * MEAN_EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

// WGS84 ellipsoid.
const WGS84_A = 6_378_137;
const WGS84_F = 1 / 298.257223563;
const WGS84_B = WGS84_A * (1 - WGS84_F);

/**
 * Geodesic distance on the WGS84 ellipsoid (Vincenty inverse), in metres.
 * Sub-millimetre accurate for the distances discovery uses (≤ ~200 km). Falls
 * back to haversine only if the iteration fails to converge (near-antipodal
 * points, which discovery never produces).
 */
export function geodesicDistanceMeters(p1: LatLng, p2: LatLng): number {
  const L = toRad(normalizeLongitude(p2.lng - p1.lng));
  const U1 = Math.atan((1 - WGS84_F) * Math.tan(toRad(p1.lat)));
  const U2 = Math.atan((1 - WGS84_F) * Math.tan(toRad(p2.lat)));
  const sinU1 = Math.sin(U1);
  const cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2);
  const cosU2 = Math.cos(U2);

  let lambda = L;
  let previous: number;
  let iterations = 0;
  let sinSigma = 0;
  let cosSigma = 0;
  let sigma = 0;
  let cosSqAlpha = 0;
  let cos2SigmaM = 0;
  do {
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);
    sinSigma = Math.sqrt((cosU2 * sinLambda) ** 2 + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) ** 2);
    if (sinSigma === 0) return 0; // coincident points
    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    const sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
    cosSqAlpha = 1 - sinAlpha * sinAlpha;
    cos2SigmaM = cosSqAlpha !== 0 ? cosSigma - (2 * sinU1 * sinU2) / cosSqAlpha : 0; // equatorial line
    const C = (WGS84_F / 16) * cosSqAlpha * (4 + WGS84_F * (4 - 3 * cosSqAlpha));
    previous = lambda;
    lambda = L + (1 - C) * WGS84_F * sinAlpha
      * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
  } while (Math.abs(lambda - previous) > 1e-12 && ++iterations < 200);
  if (iterations >= 200) return haversineMeters(p1, p2);

  const uSq = (cosSqAlpha * (WGS84_A * WGS84_A - WGS84_B * WGS84_B)) / (WGS84_B * WGS84_B);
  const A = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const deltaSigma = B * sinSigma * (cos2SigmaM + (B / 4) * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)
    - (B / 6) * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
  return WGS84_B * A * (sigma - deltaSigma);
}

/** Point reached from `origin` on a spherical Earth along `bearingDeg` for `distanceMeters`. */
export function destinationPoint(origin: LatLng, bearingDeg: number, distanceMeters: number): LatLng {
  const delta = distanceMeters / MEAN_EARTH_RADIUS_M;
  const theta = toRad(bearingDeg);
  const phi1 = toRad(origin.lat);
  const lambda1 = toRad(origin.lng);
  const sinPhi2 = Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta);
  const phi2 = Math.asin(Math.max(-1, Math.min(1, sinPhi2)));
  const lambda2 = lambda1 + Math.atan2(
    Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
    Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2),
  );
  return { lat: toDeg(phi2), lng: normalizeLongitude(toDeg(lambda2)) };
}

// ---------------------------------------------------------------------------
// Google Maps hand-off (Maps URLs, documented universal cross-platform syntax)
// ---------------------------------------------------------------------------

export interface DirectionsLinkInput {
  destination: LatLng;
  destinationPlaceId?: string | null;
  /** Only the user's actual device position or an explicitly chosen origin. Omit to let Google Maps use the device location. */
  origin?: LatLng | null;
}

const coord = (value: LatLng) => `${value.lat.toFixed(6)},${value.lng.toFixed(6)}`;

/** https://www.google.com/maps/dir/?api=1&destination=LAT,LNG&destination_place_id=ID&travelmode=driving */
export function googleMapsDirectionsUrl({ destination, destinationPlaceId, origin }: DirectionsLinkInput): string {
  const params = new URLSearchParams();
  params.set('api', '1');
  if (origin) params.set('origin', coord(origin));
  params.set('destination', coord(destination));
  if (destinationPlaceId) params.set('destination_place_id', destinationPlaceId);
  params.set('travelmode', 'driving');
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// API contract
// ---------------------------------------------------------------------------

export type DiscoveryProvider = 'google_places';

export type ConnectorKind =
  | 'CCS1' | 'CCS2' | 'TYPE1_J1772' | 'TYPE2' | 'CHADEMO' | 'GBT'
  | 'TESLA' | 'NACS' | 'WALL_OUTLET' | 'OTHER' | 'UNKNOWN';

export interface DiscoveryConnector {
  kind: ConnectorKind;
  /** Provider's maximum charge rate for this connector group; null when unpublished. */
  maxPowerKw: number | null;
  count: number | null;
  /** Live availability; null means unknown — never treat as available. */
  availableCount: number | null;
  outOfServiceCount: number | null;
  availabilityUpdatedAt: string | null;
}

export type OperationalStatus = 'operational' | 'temporarily_closed' | 'future_opening' | 'permanently_closed' | 'unknown';

export type BookingCapability =
  | { bookable: true; chargerIds: string[] }
  | { bookable: false; reason: 'no_verified_inventory' };

export interface ProviderAttribution {
  provider: string;
  providerUri: string | null;
}

export interface DiscoveryStation {
  /** Provider-stable identifier (Google place ID). */
  id: string;
  provider: DiscoveryProvider;
  name: string;
  address: string | null;
  location: LatLng;
  /** Straight-line geodesic distance from the search centre, unrounded. null when no centre applies (details). */
  distanceMeters: number | null;
  operationalStatus: OperationalStatus;
  connectors: DiscoveryConnector[];
  /** Total connectors as published; null when unknown. */
  connectorCount: number | null;
  /** Providers do not publish tariffs here; price is unknown, not free. */
  pricing: { known: false };
  booking: BookingCapability;
  googleMapsUri: string | null;
  attributions: ProviderAttribution[];
  /** ISO time this record was fetched from the provider. */
  retrievedAt: string;
}

export interface DiscoveryStationDetails extends DiscoveryStation {
  /** Provider-formatted weekly hours, verbatim; null when unpublished. */
  weekdayHours: string[] | null;
}

export type SearchStatus = 'ok' | 'empty' | 'partial';

export interface SearchCoverage {
  strategy: 'single_circle' | 'multi_circle';
  circlesPlanned: number;
  circlesQueried: number;
  circlesFailed: number;
  /** Circles where the provider returned its per-request maximum (more may exist). */
  saturatedCircles: number;
  /** True when a saturated or failed circle could hide stations closer than the last one listed. */
  mayOmitCloserStations: boolean;
}

export interface StationSearchResponse {
  status: SearchStatus;
  center: LatLng;
  radiusKm: RadiusKm;
  stations: DiscoveryStation[];
  count: number;
  limit: number;
  distanceKind: 'straight_line';
  coverage: SearchCoverage;
  provider: DiscoveryProvider;
  retrievedAt: string;
}

export type DiscoveryErrorCode =
  | 'INVALID_REQUEST'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_QUOTA'
  | 'PROVIDER_CONFIG'
  | 'PROVIDER_UNAVAILABLE';

export interface DiscoveryErrorResponse {
  status: 'error';
  code: DiscoveryErrorCode;
  message: string;
  retryable: boolean;
}

export interface LocationSuggestion {
  placeId: string;
  primaryText: string;
  secondaryText: string | null;
  types: string[];
}

export interface AutocompleteResponse {
  status: 'ok' | 'empty';
  suggestions: LocationSuggestion[];
}

export interface ResolvedLocation {
  placeId: string;
  formattedAddress: string | null;
  location: LatLng;
  types: string[];
}

export interface ReverseGeocodeResponse {
  status: 'ok' | 'empty';
  label: string | null;
}

/** Google place IDs are URL-safe base64-like tokens. */
export const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{10,300}$/;
/** Client-generated Autocomplete session token. */
export const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
