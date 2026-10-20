/**
 * Pure adapter: Google-facing `EVStation` → Explore `Station`.
 *
 * Google Places gives no reliable operator, no tariff, and no opening hours,
 * and its connector availability is only trustworthy where a network publishes
 * an availability count. This adapter maps the shapes faithfully and degrades
 * every unknown field honestly (no fabricated price/hours/live status) so the
 * cards, filters, and freshness indicator never claim data Google did not give.
 *
 * Kept pure (no `Date.now()`, no I/O) so it is deterministic and unit-testable:
 * the fetch timestamp is passed in as `fetchedAtISO`.
 *
 * Design: `.kiro/specs/explore-real-location-chargers/design.md` Section 3.
 * Validates: Requirements 2.1, 2.8.
 */
import type { EVStation, StationConnector } from '@/models/station.model';
import type { Connector, ConnectorType, Station } from './types';

/** Generic bundled placeholder; ChargerCard has an onError fallback for the asset. */
const PLACEHOLDER_IMAGE = '/mock/stations/placeholder.svg';

/** DC-fast connector types for current inference. */
const DC_TYPES: ReadonlySet<ConnectorType> = new Set<ConnectorType>(['CCS2', 'CHADEMO', 'BHARAT_DC001']);
/** Any connector at or above this power is treated as DC fast. */
const DC_MIN_KW = 25;
/** Average urban driving speed (km/h), matching filters.ts CITY_SPEED_KMH. */
const CITY_SPEED_KMH = 26;

/**
 * Google connector label (from googleMapsService CONNECTOR_LABELS) → Explore enum.
 * `'CCS2'` MUST map exactly — the CCS2 chip depends on it. Labels with no exact
 * Explore equivalent map to their closest DC/AC relative; anything unknown falls
 * back to a safe DC default via `fallbackConnectorType`.
 */
const CONNECTOR_TYPE_MAP: Record<string, ConnectorType> = {
  CCS2: 'CCS2',
  'Type 2': 'TYPE2',
  CHAdeMO: 'CHADEMO',
  'GB/T': 'BHARAT_DC001',
  CCS1: 'CCS2', // closest DC fast
  'Type 1 (J1772)': 'TYPE2',
  Tesla: 'CCS2', // closest DC fast
  NACS: 'CCS2', // closest DC fast
  'Wall outlet': 'SOCKET_15A',
  Other: 'CCS2', // safe DC default
};

const fallbackConnectorType: ConnectorType = 'CCS2';

/** Maps a Google connector label to the Explore `ConnectorType`, with a safe DC default. */
function mapConnectorType(label: string): ConnectorType {
  return CONNECTOR_TYPE_MAP[label] ?? fallbackConnectorType;
}

/**
 * Maps one Google `StationConnector` to an Explore `Connector`.
 * Availability is only honest where Google published it: unknown availability
 * maps to `'UNKNOWN'`, never a fabricated `'AVAILABLE'`.
 */
export function adaptConnector(c: StationConnector): Connector {
  const type = mapConnectorType(c.connector_type);
  const maxPowerKw = c.power_output ?? 0;
  const current: 'AC' | 'DC' = DC_TYPES.has(type) || maxPowerKw >= DC_MIN_KW ? 'DC' : 'AC';
  const status = c.availabilityKnown ? (c.available ? 'AVAILABLE' : 'CHARGING') : 'UNKNOWN';
  return { id: c.id, type, current, maxPowerKw, status };
}

/**
 * Maps a Google `EVStation` to the Explore `Station` shape with honest unknowns.
 * `fetchedAtISO` is the snapshot fetch time (passed in to keep the function pure);
 * it becomes `lastUpdated`, driving the freshness ladder downstream.
 */
export function adaptEVStation(ev: EVStation, fetchedAtISO: string): Station {
  const connectors = ev.connectors.map(adaptConnector);
  // metres → km, rounded to 0.1 km (e.g. 2449 m → 2.4 km).
  const distanceKm = Math.round(((ev.distance ?? 0) / 1000) * 10) / 10;
  const etaMin = Math.max(2, Math.round((distanceKm / CITY_SPEED_KMH) * 60));

  return {
    id: ev.id,
    slug: ev.id, // opaque place id
    name: ev.name,
    operator: { id: ev.id, name: '' }, // Google gives no reliable operator; cards show the station name
    address: { line: ev.address, locality: '', city: '' }, // single formatted line; formatAddress joins non-empty parts
    coords: { lat: ev.location.lat, lng: ev.location.lng }, // drives the projection
    preview: { x: 50, y: 50 }, // neutral placeholder; MapPreview projects real coords, does not read this for real data
    imageUrl: PLACEHOLDER_IMAGE,
    connectors,
    pricePerKwh: ev.price_per_kwh, // kept for type; hidden downstream
    priceIncludesGst: true,
    priceKnown: false, // Google never gives tariff → hide price downstream
    hours: { type: 'unknown' }, // Google returns no hours here
    distanceKm,
    etaMin,
    lastUpdated: fetchedAtISO,
    supportsRealtime: ev.connectors.some(c => c.availabilityKnown === true),
  };
}
