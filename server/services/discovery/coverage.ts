/**
 * Search-circle planner.
 *
 * Google Places Nearby Search (New) accepts a circle of at most 50 000 m and
 * returns at most 20 places per request. Radii ≤ 50 km are one circle. 100 km
 * is covered by a centre circle (r = 50 km) plus a ring of 8 circles
 * (r = 50 km) whose centres sit 75 km from the search centre:
 *
 *   - the centre circle covers 0–50 km;
 *   - each ring circle at bearing k·45° covers, at 100 km from the centre,
 *     ±28.9° around its bearing (> the ±22.5° half-spacing), and the farthest
 *     point of the 30–100 km annulus from its nearest ring centre is ~42 km.
 *
 * So every point within 100 km lies inside at least one circle with ≥ 1 km of
 * slack (proved by sampling in tests/discovery-coverage.test.ts at the
 * equator, mid and high latitudes, and across the date line). Ring centres are
 * computed with spherical destination math and longitudes are normalised, so
 * the plan stays valid at ±180° and at high latitudes.
 */
import { destinationPoint, type LatLng, type RadiusKm } from '../../../shared/discovery.js';

export const PROVIDER_MAX_RADIUS_M = 50_000;
export const PROVIDER_MAX_RESULTS = 20;
export const RING_CENTER_DISTANCE_M = 75_000;
export const RING_CIRCLES = 8;
/** Hard cap on provider requests for one search (documented cost bound). */
export const MAX_CIRCLES_PER_SEARCH = 1 + RING_CIRCLES;

export interface SearchCircle {
  id: string;
  role: 'center' | 'ring';
  center: LatLng;
  radiusMeters: number;
}

export interface SearchPlan {
  strategy: 'single_circle' | 'multi_circle';
  /** circles[0] is always the centre circle. */
  circles: SearchCircle[];
}

export function planSearchCircles(center: LatLng, radiusKm: RadiusKm): SearchPlan {
  const radiusMeters = radiusKm * 1000;
  if (radiusMeters <= PROVIDER_MAX_RADIUS_M) {
    return { strategy: 'single_circle', circles: [{ id: 'center', role: 'center', center, radiusMeters }] };
  }
  const circles: SearchCircle[] = [{ id: 'center', role: 'center', center, radiusMeters: PROVIDER_MAX_RADIUS_M }];
  for (let index = 0; index < RING_CIRCLES; index++) {
    const bearing = (360 / RING_CIRCLES) * index;
    circles.push({
      id: `ring-${bearing}`,
      role: 'ring',
      center: destinationPoint(center, bearing, RING_CENTER_DISTANCE_M),
      radiusMeters: PROVIDER_MAX_RADIUS_M,
    });
  }
  return { strategy: 'multi_circle', circles };
}
