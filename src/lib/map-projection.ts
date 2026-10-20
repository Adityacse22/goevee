/**
 * SDK-free preview projection for the Explore home map.
 *
 * `projectToPreview` converts a station's real latitude/longitude into a
 * percentage position (`x`, `y` in the 0..100 range) inside the inline SVG
 * preview, using a lightweight equirectangular projection centered on the
 * active origin and scaled so the current search radius maps to the preview's
 * usable half-extent. It is pure math — no Google Maps SDK, no tiles, no DOM,
 * no clock, no globals — so it can run on the critical path and in unit tests.
 *
 * Stations beyond the search radius are radially clamped onto the ring edge in
 * their true bearing rather than omitted, so a far-away charger still shows up
 * pinned at the edge pointing the right way (requirement 2.3).
 */

/** Mean Earth radius in metres (used by the equirectangular projection). */
export const R_EARTH_M = 6_371_000;

/** Padding (in preview percentage points) kept clear around every edge. */
export const MARGIN = 6;

/** Usable half-extent from the center: a point at the radius lands here. */
export const EDGE = 50 - MARGIN; // 44

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Project a station's real coordinates to a preview position.
 *
 * The origin sits at the center (`{ x: 50, y: 50 }`). A point exactly at
 * `radiusMeters` along a cardinal direction lands on the ring (`MARGIN` or
 * `100 - MARGIN`). Points past the radius clamp onto the ring, keeping bearing.
 * SVG `y` grows downward, so north is inverted.
 *
 * @returns `{ x, y }` as percentages in the 0..100 range.
 */
export function projectToPreview(
  originLat: number,
  originLng: number,
  stationLat: number,
  stationLng: number,
  radiusMeters: number,
): { x: number; y: number } {
  const dLat = toRad(stationLat - originLat);
  const dLng = toRad(stationLng - originLng);

  const northMeters = dLat * R_EARTH_M;
  const eastMeters = dLng * R_EARTH_M * Math.cos(toRad(originLat)); // longitude shrinks by cos(lat)

  let fx = eastMeters / radiusMeters; // -1..1 at the radius ring
  let fy = northMeters / radiusMeters;

  const mag = Math.hypot(fx, fy);
  if (mag > 1) {
    // Radial clamp to the ring, keeping the true bearing (do NOT omit).
    fx /= mag;
    fy /= mag;
  }

  const x = 50 + fx * EDGE;
  const y = 50 - fy * EDGE; // SVG y grows downward → invert north

  return { x, y };
}
