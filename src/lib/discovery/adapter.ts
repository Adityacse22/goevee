/**
 * Discovery API station → Explore `Station` view model.
 * Pure. Unknowns stay unknown: no price, no hours, no ETA, no guessed AC/DC,
 * and connector status is UNKNOWN unless the provider published a count.
 */
import type { ConnectorKind, DiscoveryConnector, DiscoveryStation } from '../../../shared/discovery';
import type { Connector, ConnectorType, EvseStatus, Station } from '../types';

const PLACEHOLDER_IMAGE = '/mock/stations/placeholder.svg';
/** Upper bound on expanded connector rows per station (keeps the DOM small). */
const MAX_CONNECTORS = 40;

export const TYPE_FOR: Record<ConnectorKind, ConnectorType> = {
  CCS1: 'CCS1',
  CCS2: 'CCS2',
  TYPE1_J1772: 'TYPE1',
  TYPE2: 'TYPE2',
  CHADEMO: 'CHADEMO',
  GBT: 'GBT',
  TESLA: 'TESLA',
  NACS: 'NACS',
  WALL_OUTLET: 'WALL_OUTLET',
  OTHER: 'OTHER',
  UNKNOWN: 'UNKNOWN',
};

/** Current type only where the connector standard defines it. */
const CURRENT_FOR: Partial<Record<ConnectorKind, 'AC' | 'DC'>> = {
  CCS1: 'DC',
  CCS2: 'DC',
  CHADEMO: 'DC',
  TYPE1_J1772: 'AC',
  TYPE2: 'AC',
  WALL_OUTLET: 'AC',
};

export function adaptConnectorGroup(group: DiscoveryConnector, groupIndex: number, stationId: string): Connector[] {
  const total = group.count ?? 1;
  const known = group.availableCount != null;
  const available = group.availableCount ?? 0;
  const outOfService = group.outOfServiceCount ?? 0;
  return Array.from({ length: Math.max(1, Math.min(total, MAX_CONNECTORS)) }, (_, index) => {
    let status: EvseStatus = 'UNKNOWN';
    if (known) status = index < available ? 'AVAILABLE' : index < available + outOfService ? 'OUTOFORDER' : 'CHARGING';
    return {
      id: `${stationId}:${groupIndex}:${index}`,
      type: TYPE_FOR[group.kind] ?? 'UNKNOWN',
      current: CURRENT_FOR[group.kind] ?? null,
      maxPowerKw: group.maxPowerKw,
      status,
    };
  });
}

export function adaptDiscoveryStation(station: DiscoveryStation): Station {
  const connectors = station.connectors.flatMap((group, index) => adaptConnectorGroup(group, index, station.id)).slice(0, MAX_CONNECTORS);
  const availabilityTimes = station.connectors
    .filter(group => group.availableCount != null && group.availabilityUpdatedAt)
    .map(group => Date.parse(group.availabilityUpdatedAt as string))
    .filter(Number.isFinite);
  const supportsRealtime = availabilityTimes.length > 0;
  return {
    id: station.id,
    slug: station.id,
    name: station.name,
    operator: { id: station.id, name: '' },
    address: { line: station.address ?? '', locality: '', city: '' },
    coords: { lat: station.location.lat, lng: station.location.lng },
    preview: { x: 50, y: 50 },
    imageUrl: PLACEHOLDER_IMAGE,
    connectors,
    pricePerKwh: 0,
    priceIncludesGst: false,
    priceKnown: false,
    hours: { type: 'unknown' },
    distanceKm: station.distanceMeters == null ? Number.NaN : station.distanceMeters / 1000,
    etaMin: null,
    // Freshness follows the provider's availability timestamp, not our fetch time.
    lastUpdated: supportsRealtime ? new Date(Math.max(...availabilityTimes)).toISOString() : station.retrievedAt,
    supportsRealtime,
    discovery: {
      provider: station.provider,
      placeId: station.id,
      operationalStatus: station.operationalStatus,
      googleMapsUri: station.googleMapsUri,
      retrievedAt: station.retrievedAt,
      bookable: station.booking.bookable,
      attributions: station.attributions,
    },
  };
}
