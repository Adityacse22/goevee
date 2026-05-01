/**
 * MODEL — Search / geocoding domain types and helpers.
 *
 * Consolidates:
 *   - SearchResult, SearchSuggestion
 *   - Coords, LocationStatus            (SearchContext.tsx)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Coords {
  lat: number;
  lng: number;
}

export type LocationStatus = 'idle' | 'loading' | 'active';

export interface SearchResult {
  lat: number | null;
  lng: number | null;
  name: string;
  address: string;
  eLoc: string;
  viewport?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
}

export interface SearchSuggestion extends SearchResult {
  id: string;
  type?: string;
}

/** Raw shape returned by the Google Places API. */
export interface GooglePlacesSuggestion {
  latitude?: string | number;
  longitude?: string | number;
  placeName?: string;
  placeAddress?: string;
  eLoc?: string;
  type?: string;
}

// ─── Pure Helpers ────────────────────────────────────────────────────────────

/**
 * Safely parse a value to a float coordinate.
 * Returns null for any non-numeric input.
 */
export function parseCoordinate(value: unknown): number | null {
  const parsed = Number.parseFloat(String(value));
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * From a list of search results, pick the most relevant one
 * (preferring CITY / DISTRICT / STATE / VILLAGE / LOCALITY types).
 */
export function pickBestLocation<T extends { type?: string }>(results: T[]): T | null {
  const preferredTypes = new Set([
    'CITY',
    'DISTRICT',
    'STATE',
    'VILLAGE',
    'LOCALITY',
  ]);

  return (
    results.find((r) => preferredTypes.has(String(r.type ?? '').toUpperCase())) ??
    results[0] ??
    null
  );
}

/**
 * Maps a raw Google Places suggestion into our SearchSuggestion shape.
 */
export function mapSuggestion(
  result: GooglePlacesSuggestion,
  fallbackQuery: string,
  index: number,
): SearchSuggestion {
  return {
    id: String(result.eLoc ?? `${fallbackQuery}-${index}`),
    lat: parseCoordinate(result.latitude),
    lng: parseCoordinate(result.longitude),
    name: result.placeName ?? fallbackQuery,
    address: result.placeAddress ?? '',
    eLoc: result.eLoc ?? '',
    type: result.type,
  };
}
