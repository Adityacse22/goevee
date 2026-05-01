/**
 * UTILS — Formatting helpers (deduplicated).
 *
 * Replaces:
 *   - formatDistance()          in Map.tsx (line 62)
 *   - formatStationDistance()   in StationPanel.tsx (line 16)
 *   which were identical implementations.
 */

/**
 * Formats a distance in metres into a human-readable string.
 * - Under 1 000 m → "850 m"
 * - 1 000 m and above → "1.5 km"
 * - Undefined → "Distance unavailable"
 */
export function formatDistance(distanceMetres?: number): string {
  if (distanceMetres == null) {
    return 'Distance unavailable';
  }

  return distanceMetres < 1000
    ? `${Math.round(distanceMetres)} m`
    : `${(distanceMetres / 1000).toFixed(1)} km`;
}

/**
 * Formats a price in INR (₹).
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(0)}`;
}

/**
 * Formats a price per kWh.
 */
export function formatPricePerKwh(price: number): string {
  return `₹${price}/kWh`;
}
