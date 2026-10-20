/**
 * GoEvee Explore — filters and sort mirrored in the URL so links can be
 * shared and the back button restores the same list.
 * ?available=1 · connector=ccs2 · minKw=60 · maxPrice=15 · sort=price · radius=20
 * "Available now" is opt-in (available=1): most provider listings publish no
 * live availability, and hiding them by default would empty real result lists.
 */
import { FAST_MIN_KW, PRICE_CEILING } from './filters';
import type { ConnectorType, Filters, Origin, SortKey } from './types';

const CONNECTOR_TYPES: ConnectorType[] = ['CCS2', 'TYPE2', 'CHADEMO', 'BHARAT_AC001', 'BHARAT_DC001', 'LECCS', 'SOCKET_15A'];
const SORT_KEYS: SortKey[] = ['distance', 'price', 'power', 'availability'];
const FILTER_PARAMS = ['available', 'connector', 'minKw', 'maxPrice', 'sort'];

const positive = (value: string | null) => {
  const parsed = Number(value);
  return value != null && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export function parseFilters(params: URLSearchParams): Filters {
  const connectorParam = params.get('connector')?.toUpperCase();
  const connector = CONNECTOR_TYPES.find(type => type === connectorParam) ?? null;
  return {
    available: params.get('available') === '1',
    connector,
    minKw: positive(params.get('minKw')),
    maxPrice: positive(params.get('maxPrice')),
  };
}

export function parseSort(params: URLSearchParams): SortKey {
  const value = params.get('sort');
  return SORT_KEYS.find(key => key === value) ?? 'distance';
}

/** Writes filters + sort into a copy of `params`, keeping unrelated keys. */
export function writeFilters(params: URLSearchParams, filters: Filters, sort: SortKey): URLSearchParams {
  const next = new URLSearchParams(params);
  FILTER_PARAMS.forEach(key => next.delete(key));
  if (filters.available) next.set('available', '1');
  if (filters.connector) next.set('connector', filters.connector.toLowerCase());
  if (filters.minKw != null) next.set('minKw', String(filters.minKw));
  if (filters.maxPrice != null) next.set('maxPrice', String(filters.maxPrice));
  if (sort !== 'distance') next.set('sort', sort);
  return next;
}

/** "?available=1&connector=ccs2" — or "" for the default view. */
export function filterQuery(filters: Filters, sort: SortKey): string {
  const query = writeFilters(new URLSearchParams(), filters, sort).toString();
  return query ? `?${query}` : '';
}

/**
 * Deep link from the home preview to the real map page. Carries the active
 * filters/sort plus the search origin (lat/lng + label) so the destination
 * opens centered on the same place the preview was showing.
 * e.g. "/ev-charger-station?connector=ccs2&lat=28.627&lng=77.365&label=Your%20location"
 */
export function previewHref(origin: Origin, filters: Filters, sort: SortKey): string {
  const params = writeFilters(new URLSearchParams(), filters, sort);
  params.set('lat', String(origin.coords.lat));
  params.set('lng', String(origin.coords.lng));
  if (origin.label) params.set('label', origin.label);
  return `/ev-charger-station?${params.toString()}`;
}

export const QUICK_FILTER_VALUES = { minKw: FAST_MIN_KW, maxPrice: PRICE_CEILING };
