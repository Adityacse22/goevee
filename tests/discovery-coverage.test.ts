import test from 'node:test';
import assert from 'node:assert/strict';
import { destinationPoint, geodesicDistanceMeters, type LatLng } from '../shared/discovery';
import { MAX_CIRCLES_PER_SEARCH, planSearchCircles, PROVIDER_MAX_RADIUS_M } from '../server/services/discovery/coverage';

const CENTRES: Array<[string, LatLng]> = [
  ['equator', { lat: 0, lng: 0 }],
  ['New Delhi', { lat: 28.6139, lng: 77.209 }],
  ['Bengaluru', { lat: 12.9716, lng: 77.5946 }],
  ['Reykjavik (64°N)', { lat: 64.1466, lng: -21.9426 }],
  ['Svalbard (78°N)', { lat: 78.2232, lng: 15.6267 }],
  ['near the north pole (88°N)', { lat: 88, lng: 10 }],
  ['Antarctica (-80°)', { lat: -80, lng: 0 }],
  ['Fiji, east of the date line', { lat: -16.5, lng: 179.95 }],
  ['Fiji, west of the date line', { lat: -16.5, lng: -179.95 }],
];

for (const radiusKm of [10, 20, 30, 50] as const) {
  test(`${radiusKm} km uses one circle with exactly the selected radius`, () => {
    const plan = planSearchCircles({ lat: 28.6, lng: 77.2 }, radiusKm);
    assert.equal(plan.strategy, 'single_circle');
    assert.equal(plan.circles.length, 1);
    assert.equal(plan.circles[0].radiusMeters, radiusKm * 1000);
  });
}

test('100 km plan stays within provider limits and the request cap', () => {
  const plan = planSearchCircles({ lat: 28.6, lng: 77.2 }, 100);
  assert.equal(plan.strategy, 'multi_circle');
  assert.equal(plan.circles.length, MAX_CIRCLES_PER_SEARCH);
  assert.equal(plan.circles[0].role, 'center');
  for (const circle of plan.circles) {
    assert.ok(circle.radiusMeters <= PROVIDER_MAX_RADIUS_M);
    assert.ok(Math.abs(circle.center.lat) <= 90 && circle.center.lng >= -180 && circle.center.lng < 180);
  }
});

for (const [name, centre] of CENTRES) {
  test(`100 km plan covers every sampled point with ≥ 1 km slack: ${name}`, () => {
    const plan = planSearchCircles(centre, 100);
    let checked = 0;
    let worstSlack = Infinity;
    for (let bearing = 0; bearing < 360; bearing += 2.5) {
      for (let distance = 0; distance <= 100_000; distance += 2_500) {
        const point = destinationPoint(centre, bearing, distance);
        if (geodesicDistanceMeters(centre, point) > 100_000) continue;
        const slack = Math.max(...plan.circles.map(circle => circle.radiusMeters - geodesicDistanceMeters(circle.center, point)));
        worstSlack = Math.min(worstSlack, slack);
        checked++;
      }
    }
    assert.ok(checked > 5000, `checked ${checked}`);
    assert.ok(worstSlack >= 1000, `${name}: worst slack ${worstSlack.toFixed(0)} m`);
  });
}

test('naive centre + 4 offset circles would leave gaps (why the ring has 8)', () => {
  const centre = { lat: 28.6139, lng: 77.209 };
  const naive = [centre, ...[0, 90, 180, 270].map(bearing => destinationPoint(centre, bearing, 50_000))];
  const gap = destinationPoint(centre, 45, 95_000);
  assert.ok(naive.every(point => geodesicDistanceMeters(point, gap) > 50_000));
  const plan = planSearchCircles(centre, 100);
  assert.ok(plan.circles.some(circle => geodesicDistanceMeters(circle.center, gap) <= 50_000));
});
