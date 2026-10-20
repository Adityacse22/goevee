/**
 * GoEvee Explore — domain types.
 * Connector statuses follow OCPI 2.2 EVSE status values so the real
 * aggregator feed can replace the mock service without remapping.
 */

export type ConnectorType =
  | 'CCS2'
  | 'TYPE2'
  | 'CHADEMO'
  | 'BHARAT_AC001'
  | 'BHARAT_DC001'
  | 'LECCS'
  | 'SOCKET_15A'
  // Provider-reported types without a closer Explore equivalent. Never remapped to a different standard.
  | 'CCS1'
  | 'TYPE1'
  | 'GBT'
  | 'TESLA'
  | 'NACS'
  | 'WALL_OUTLET'
  | 'OTHER'
  | 'UNKNOWN';

export type EvseStatus =
  | 'AVAILABLE'
  | 'CHARGING'
  | 'RESERVED'
  | 'BLOCKED'
  | 'INOPERATIVE'
  | 'OUTOFORDER'
  | 'UNKNOWN';

export type VehicleSegment = '2W' | '3W' | '4W';

export interface Vehicle {
  id: string;
  displayName: string;
  segment: VehicleSegment;
  imageUrl: string;
  connectors: ConnectorType[];
  batteryKwh: number;
  socPercent: number;
  rangeKm: number;
}

export interface Connector {
  id: string;
  type: ConnectorType;
  /** null when the current type is not published (never guessed). */
  current: 'AC' | 'DC' | null;
  /** null when the provider did not publish a charge rate. */
  maxPowerKw: number | null;
  status: EvseStatus;
}

/** Opening hours. Times are 'HH:mm' in IST (Asia/Kolkata). */
export type StationHours =
  | { type: '24x7' }
  | { type: 'daily'; open: string; close: string }
  | { type: 'unknown' };

export interface Station {
  id: string;
  slug: string;
  name: string;
  operator: { id: string; name: string; logoUrl?: string };
  address: { line: string; locality: string; city: string };
  coords: { lat: number; lng: number };
  /** Percentage position of the pin tip inside the SVG map preview. */
  preview: { x: number; y: number };
  imageUrl: string;
  connectors: Connector[];
  pricePerKwh: number;
  priceIncludesGst: boolean;
  /** absent/undefined = price known (mock data); `false` = price unavailable (real Google data) and must be hidden. */
  priceKnown?: boolean;
  hours: StationHours;
  /** Straight-line distance from the search centre (km, unrounded for discovery data). */
  distanceKm: number;
  /** Drive-time estimate; null when no routing source provides one (discovery data). */
  etaMin: number | null;
  /** ISO timestamp of the last status update from the operator feed. */
  lastUpdated: string;
  supportsRealtime: boolean;
  /** Present for provider-discovered stations: provenance and capabilities. */
  discovery?: StationProvenance;
}

export interface StationProvenance {
  provider: 'google_places';
  placeId: string;
  operationalStatus: 'operational' | 'temporarily_closed' | 'future_opening' | 'permanently_closed' | 'unknown';
  googleMapsUri: string | null;
  retrievedAt: string;
  bookable: boolean;
  attributions: { provider: string; providerUri: string | null }[];
}

export type AvailabilityLevel = 'available' | 'limited' | 'full' | 'offline';

/** What the availability badge shows once freshness and hours are considered. */
export type BadgeState = AvailabilityLevel | 'closed' | 'unknown';

export type Freshness =
  | { kind: 'live' }
  | { kind: 'recent'; minutes: number }
  | { kind: 'unavailable' };

export type PowerTier = 'slow' | 'standard' | 'fast' | 'ultra';

export type SortKey = 'distance' | 'price' | 'power' | 'availability';

export interface Filters {
  /** At least one free connector, station not offline, data ≤ 15 min old. */
  available: boolean;
  /** Connector type chosen from the selected vehicle's fast-charge connector. */
  connector: ConnectorType | null;
  /** Minimum connector power in kW. */
  minKw: number | null;
  /** Price ceiling in ₹/kWh including GST (strictly below). */
  maxPrice: number | null;
}

export interface Place {
  id: string;
  name: string;
  area: string;
  coords: { lat: number; lng: number };
}

export interface Origin {
  kind: 'default' | 'current' | 'place';
  label: string;
  coords: { lat: number; lng: number };
}

export type LiveConnectionState = 'connecting' | 'live' | 'reconnecting' | 'polling' | 'paused';
