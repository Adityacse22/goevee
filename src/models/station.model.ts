/**
 * MODEL — Station domain types and pure business logic.
 *
 * Consolidates the previously scattered type definitions:
 *   - EVStation + Connector   (Map.tsx)
 *   - EVStation (different)   (StationList.tsx)
 *   - Station + StationConnector (types/database.ts)
 *   - Station (Google Maps API)
 *   - MockStation             (mockStations.ts)
 *
 * Also extracts normalizeStation() and isStationAvailable() logic
 * that was embedded inside Map.tsx.
 */

// ─── Core Domain Types ───────────────────────────────────────────────────────

/** A single charging connector on a station. */
export interface StationConnector {
  id: string;
  station_id: string;
  connector_type: string;
  power_output: number;
  available: boolean;
  created_at: string;
}

/** Coordinates used across the app. */
export interface Location {
  lat: number;
  lng: number;
}

/**
 * Canonical station type used by views throughout the app.
 * Replaces the multiple divergent EVStation / MockStation interfaces.
 */
export interface EVStation {
  id: string;
  name: string;
  location: Location;
  rating: number;
  total_reviews: number;
  address: string;
  price_per_kwh: number;
  available: boolean;
  connectors: StationConnector[];
  distance?: number;
  isOpen?: boolean;
}

// ─── Database Types (Drizzle row shapes) ────────────────────────────────────

/** Station row as stored in the `stations` table. */
export interface StationRow {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price_per_kwh: number;
  available: boolean;
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

/** Station row joined with its connectors. */
export interface StationWithConnectors extends StationRow {
  connectors: StationConnector[];
}

// ─── Google Places API Types ────────────────────────────────────────────────────────

/** Raw station shape returned by the Google Places API. */
export interface GooglePlacesStation {
  placeName: string;
  placeAddress: string;
  latitude: string;
  longitude: string;
  distance: number;
  type?: string;
}

// ─── Pure Business Logic ─────────────────────────────────────────────────────

/**
 * Deterministic availability check seeded by a string.
 * Produces the same result for the same input — no random flicker.
 * (Extracted from Map.tsx lines 51-60.)
 */
export function isStationAvailable(seed: string): boolean {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 100 >= 35;
}

/**
 * Converts a raw Google Places result into an EVStation.
 * Returns null if coordinates are invalid.
 * (Extracted from Map.tsx lines 72-104.)
 */
export function normalizeGooglePlacesStation(
  station: GooglePlacesStation,
  index: number,
): EVStation | null {
  const lat = Number.parseFloat(station.latitude);
  const lng = Number.parseFloat(station.longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  const available = isStationAvailable(
    `${station.placeName}-${station.placeAddress}-${index}`,
  );

  return {
    id: `${station.placeName}-${index}`,
    name: station.placeName,
    location: { lat, lng },
    rating: 4.2,
    total_reviews: 0,
    address: station.placeAddress || 'Address unavailable',
    price_per_kwh: 15,
    available,
    connectors: [
      {
        id: `${station.placeName}-${index}-connector`,
        station_id: `${station.placeName}-${index}`,
        connector_type: 'CCS2',
        power_output: 50,
        available,
        created_at: new Date().toISOString(),
      },
    ],
    distance: station.distance,
    isOpen: true,
  };
}
