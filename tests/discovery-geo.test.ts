import test from 'node:test';
import assert from 'node:assert/strict';
import {
  destinationPoint,
  geodesicDistanceMeters,
  googleMapsDirectionsUrl,
  haversineMeters,
  normalizeLongitude,
  parseRadiusKm,
  RADIUS_OPTIONS_KM,
} from '../shared/discovery';

test('geodesic distance matches published WGS84 reference values', () => {
  // Vincenty (1975) Flinders Peak → Buninyong: 54 972.271 m.
  const flinders = { lat: -(37 + 57 / 60 + 3.7203 / 3600), lng: 144 + 25 / 60 + 29.5244 / 3600 };
  const buninyong = { lat: -(37 + 39 / 60 + 10.1561 / 3600), lng: 143 + 55 / 60 + 35.3839 / 3600 };
  assert.ok(Math.abs(geodesicDistanceMeters(flinders, buninyong) - 54_972.271) < 0.01);
  // One degree of longitude on the equator = a·π/180 = 111 319.4908 m.
  assert.ok(Math.abs(geodesicDistanceMeters({ lat: 0, lng: 0 }, { lat: 0, lng: 1 }) - 111_319.4908) < 0.01);
  // One degree of latitude from the equator: 110 574.389 m.
  assert.ok(Math.abs(geodesicDistanceMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 }) - 110_574.389) < 0.01);
  assert.equal(geodesicDistanceMeters({ lat: 28.6, lng: 77.2 }, { lat: 28.6, lng: 77.2 }), 0);
});

test('distance is symmetric, handles the date line, and agrees with haversine within 0.5 %', () => {
  const a = { lat: -16.5, lng: 179.9 };
  const b = { lat: -16.5, lng: -179.9 };
  const across = geodesicDistanceMeters(a, b);
  assert.ok(across > 21_000 && across < 22_000, `date-line distance ${across}`);
  assert.ok(Math.abs(geodesicDistanceMeters(a, b) - geodesicDistanceMeters(b, a)) < 1e-6);
  for (const [p, q] of [[{ lat: 28.61, lng: 77.21 }, { lat: 28.98, lng: 77.70 }], [{ lat: 64.1, lng: -21.9 }, { lat: 64.9, lng: -23.1 }]]) {
    const ellipsoid = geodesicDistanceMeters(p, q);
    assert.ok(Math.abs(ellipsoid - haversineMeters(p, q)) / ellipsoid < 0.005);
  }
});

test('destination point round-trips distance and wraps longitude', () => {
  const start = { lat: 28.6139, lng: 77.209 };
  for (const bearing of [0, 45, 90, 180, 270]) {
    const end = destinationPoint(start, bearing, 75_000);
    assert.ok(Math.abs(haversineMeters(start, end) - 75_000) < 0.5);
  }
  const wrapped = destinationPoint({ lat: 0, lng: 179.9 }, 90, 50_000);
  assert.ok(wrapped.lng < -179 && wrapped.lng >= -180);
  assert.equal(normalizeLongitude(181), -179);
  assert.equal(normalizeLongitude(-180), -180);
  assert.equal(normalizeLongitude(540), -180);
});

test('radius parsing accepts only the published options and never clamps', () => {
  assert.deepEqual([...RADIUS_OPTIONS_KM], [10, 20, 30, 50, 100]);
  for (const value of ['10', '20', '30', '50', '100', 10, 100]) assert.notEqual(parseRadiusKm(value), null);
  for (const value of ['15', '0', '-10', '1e2', '100.0', ' ', 'abc', 75, 1000, null, undefined]) assert.equal(parseRadiusKm(value), null);
});

test('Google Maps hand-off URL uses the documented directions parameters', () => {
  const url = new URL(googleMapsDirectionsUrl({ destination: { lat: 28.627981, lng: 77.3648567 }, destinationPlaceId: 'ChIJabcdefghij' }));
  assert.equal(url.origin + url.pathname, 'https://www.google.com/maps/dir/');
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('destination'), '28.627981,77.364857');
  assert.equal(url.searchParams.get('destination_place_id'), 'ChIJabcdefghij');
  assert.equal(url.searchParams.get('travelmode'), 'driving');
  assert.equal(url.searchParams.has('origin'), false, 'origin is omitted so Google Maps uses the device location');
  const withOrigin = new URL(googleMapsDirectionsUrl({ destination: { lat: 1, lng: 2 }, origin: { lat: 3, lng: 4 } }));
  assert.equal(withOrigin.searchParams.get('origin'), '3.000000,4.000000');
  assert.equal(withOrigin.searchParams.has('destination_place_id'), false);
});
