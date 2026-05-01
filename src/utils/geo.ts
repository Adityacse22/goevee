/**
 * UTILS — Geo / coordinate helpers.
 *
 * Consolidates:
 *   - calculateDistance() (Haversine)  from StationList.tsx
 *   - parseCoordinate()               from Map.tsx line 46
 *     (Note: also in search.model.ts — this is the map-specific variant.)
 */

/**
 * Converts degrees to radians.
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Haversine distance between two lat/lng points, in kilometres.
 * (Extracted from StationList.tsx lines 30-44.)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Safely parse a value to a float coordinate.
 * Returns null for any non-numeric input.
 */
export function parseMapCoordinate(value: unknown): number | null {
  const parsed = Number.parseFloat(String(value));
  return Number.isNaN(parsed) ? null : parsed;
}
