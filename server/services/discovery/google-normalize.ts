/**
 * Google Places (New) REST place → provider-neutral station record.
 * Pure: no I/O, no clock (retrievedAt is passed in). Every field Google did
 * not publish stays null/empty — no defaults that look like real data.
 */
import {
  isValidLatLng,
  type ConnectorKind,
  type DiscoveryConnector,
  type DiscoveryStation,
  type OperationalStatus,
  type ProviderAttribution,
} from '../../../shared/discovery.js';

/** Subset of the REST Place resource requested through field masks. */
export interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  businessStatus?: string;
  googleMapsUri?: string;
  evChargeOptions?: {
    connectorCount?: number;
    connectorAggregation?: Array<{
      type?: string;
      maxChargeRateKw?: number;
      count?: number;
      availableCount?: number;
      outOfServiceCount?: number;
      availabilityLastUpdateTime?: string;
    }>;
  };
  attributions?: Array<{ provider?: string; providerUri?: string }>;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
}

/** Station as the provider describes it — before distance and booking capability are attached. */
export type ProviderStation = Omit<DiscoveryStation, 'distanceMeters' | 'booking'> & { weekdayHours: string[] | null };

const CONNECTOR_KINDS: Record<string, ConnectorKind> = {
  EV_CONNECTOR_TYPE_CCS_COMBO_1: 'CCS1',
  EV_CONNECTOR_TYPE_CCS_COMBO_2: 'CCS2',
  EV_CONNECTOR_TYPE_J1772: 'TYPE1_J1772',
  EV_CONNECTOR_TYPE_TYPE_2: 'TYPE2',
  EV_CONNECTOR_TYPE_CHADEMO: 'CHADEMO',
  EV_CONNECTOR_TYPE_UNSPECIFIED_GB_T: 'GBT',
  EV_CONNECTOR_TYPE_TESLA: 'TESLA',
  EV_CONNECTOR_TYPE_NACS: 'NACS',
  EV_CONNECTOR_TYPE_UNSPECIFIED_WALL_OUTLET: 'WALL_OUTLET',
  EV_CONNECTOR_TYPE_OTHER: 'OTHER',
};

const STATUSES: Record<string, OperationalStatus> = {
  OPERATIONAL: 'operational',
  CLOSED_TEMPORARILY: 'temporarily_closed',
  CLOSED_PERMANENTLY: 'permanently_closed',
  FUTURE_OPENING: 'future_opening',
};

const count = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < 10_000 ? value : null;

const power = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 2000 ? value : null;

const text = (value: unknown, max = 300): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

const isoTime = (value: unknown): string | null =>
  typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;

const httpsUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  try {
    return new URL(value).protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
};

export function normalizeConnectors(options: GooglePlace['evChargeOptions']): DiscoveryConnector[] {
  const groups = Array.isArray(options?.connectorAggregation) ? options.connectorAggregation : [];
  return groups.slice(0, 20).map(group => {
    const total = count(group.count);
    let available = count(group.availableCount);
    let outOfService = count(group.outOfServiceCount);
    // Inconsistent counts mean the availability snapshot can't be trusted.
    if (total != null && ((available ?? 0) + (outOfService ?? 0) > total)) {
      available = null;
      outOfService = null;
    }
    return {
      kind: CONNECTOR_KINDS[group.type ?? ''] ?? 'UNKNOWN',
      maxPowerKw: power(group.maxChargeRateKw),
      count: total,
      availableCount: available,
      outOfServiceCount: outOfService,
      availabilityUpdatedAt: available == null ? null : isoTime(group.availabilityLastUpdateTime),
    };
  });
}

/** Returns null when the record lacks a stable ID or valid coordinates (never invent either). */
export function normalizeGooglePlace(place: GooglePlace, retrievedAt: string): ProviderStation | null {
  const id = text(place.id, 300);
  const location = { lat: place.location?.latitude, lng: place.location?.longitude };
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id) || !isValidLatLng(location)) return null;
  const attributions: ProviderAttribution[] = (Array.isArray(place.attributions) ? place.attributions : [])
    .map(item => ({ provider: text(item.provider, 120), providerUri: httpsUrl(item.providerUri) }))
    .filter((item): item is ProviderAttribution => item.provider != null);
  const weekdayHours = Array.isArray(place.regularOpeningHours?.weekdayDescriptions)
    ? place.regularOpeningHours.weekdayDescriptions.map(line => text(line, 120)).filter((line): line is string => line != null).slice(0, 7)
    : [];
  return {
    id,
    provider: 'google_places',
    name: text(place.displayName?.text, 200) ?? '',
    address: text(place.formattedAddress) ?? text(place.shortFormattedAddress),
    location,
    operationalStatus: STATUSES[place.businessStatus ?? ''] ?? 'unknown',
    connectors: normalizeConnectors(place.evChargeOptions),
    connectorCount: count(place.evChargeOptions?.connectorCount),
    pricing: { known: false },
    googleMapsUri: httpsUrl(place.googleMapsUri),
    attributions,
    retrievedAt,
    weekdayHours: weekdayHours.length ? weekdayHours : null,
  };
}
