import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EDGE, MARGIN, R_EARTH_M, projectToPreview } from '../src/lib/map-projection';

// Reference origin: Sector 62, Noida (DEFAULT_ORIGIN) and the Explore radius.
const ORIGIN_LAT = 28.627;
const ORIGIN_LNG = 77.365;
const RADIUS = 15_000; // 15 km (DEFAULT_RADIUS)

const EXACT = 1e-6; // for exact-center expectations
const TRIG = 1e-3; // for derived-offset trig (metre→degree round-trips)

const toDeg = (rad: number) => (rad * 180) / Math.PI;

// Degrees of latitude that are `metres` due north of the origin.
const latOffsetDegForMetres = (metres: number) => toDeg(metres / R_EARTH_M);

// Degrees of longitude that are `metres` due east of the origin (shrinks by cos(lat)).
const lngOffsetDegForMetres = (metres: number, originLat: number) =>
  toDeg(metres / (R_EARTH_M * Math.cos((originLat * Math.PI) / 180)));

test('origin === station projects to the exact center { 50, 50 }', () => {
  const { x, y } = projectToPreview(ORIGIN_LAT, ORIGIN_LNG, ORIGIN_LAT, ORIGIN_LNG, RADIUS);
  assert.ok(Math.abs(x - 50) < EXACT, `x=${x}`);
  assert.ok(Math.abs(y - 50) < EXACT, `y=${y}`);
});

test('a point due north at exactly the radius lands on the top edge (x≈50, y≈MARGIN)', () => {
  const stationLat = ORIGIN_LAT + latOffsetDegForMetres(RADIUS);
  const { x, y } = projectToPreview(ORIGIN_LAT, ORIGIN_LNG, stationLat, ORIGIN_LNG, RADIUS);
  assert.ok(Math.abs(x - 50) < TRIG, `x=${x}`);
  assert.ok(Math.abs(y - MARGIN) < TRIG, `y=${y}`); // north inverted → top edge
});

test('a point due east at exactly the radius lands on the right edge (y≈50, x≈50+EDGE)', () => {
  const stationLng = ORIGIN_LNG + lngOffsetDegForMetres(RADIUS, ORIGIN_LAT);
  const { x, y } = projectToPreview(ORIGIN_LAT, ORIGIN_LNG, ORIGIN_LAT, stationLng, RADIUS);
  assert.ok(Math.abs(y - 50) < TRIG, `y=${y}`);
  assert.ok(Math.abs(x - (50 + EDGE)) < TRIG, `x=${x}`);
});

test('a beyond-radius point (2× radius north) clamps exactly onto the ring', () => {
  const stationLat = ORIGIN_LAT + latOffsetDegForMetres(2 * RADIUS);
  const { x, y } = projectToPreview(ORIGIN_LAT, ORIGIN_LNG, stationLat, ORIGIN_LNG, RADIUS);
  // Offset magnitude from the center equals EDGE (pinned to the ring).
  const mag = Math.hypot(x - 50, y - 50);
  assert.ok(Math.abs(mag - EDGE) < TRIG, `mag=${mag}`);
  // Stays inside the padded box.
  assert.ok(x >= MARGIN - EXACT && x <= 100 - MARGIN + EXACT, `x=${x}`);
  assert.ok(y >= MARGIN - EXACT && y <= 100 - MARGIN + EXACT, `y=${y}`);
  // Due north bearing preserved: x stays centered, y pinned to the top.
  assert.ok(Math.abs(x - 50) < TRIG, `x=${x}`);
  assert.ok(Math.abs(y - MARGIN) < TRIG, `y=${y}`);
});

test('longitude is scaled by cos(lat): same lng delta → smaller x-offset at higher latitude', () => {
  const dLng = 0.1; // same longitude delta applied at two different origin latitudes
  const equator = projectToPreview(0, 0, 0, dLng, RADIUS);
  const higher = projectToPreview(60, 0, 60, dLng, RADIUS);
  const equatorOffset = Math.abs(equator.x - 50);
  const higherOffset = Math.abs(higher.x - 50);
  assert.ok(higherOffset < equatorOffset, `higher=${higherOffset} should be < equator=${equatorOffset}`);
});

test('north/south symmetry: y mirrors about 50 for equal-and-opposite latitude offsets', () => {
  const dLatDeg = latOffsetDegForMetres(RADIUS * 0.5);
  const north = projectToPreview(ORIGIN_LAT, ORIGIN_LNG, ORIGIN_LAT + dLatDeg, ORIGIN_LNG, RADIUS);
  const south = projectToPreview(ORIGIN_LAT, ORIGIN_LNG, ORIGIN_LAT - dLatDeg, ORIGIN_LNG, RADIUS);
  assert.ok(Math.abs(north.x - 50) < TRIG && Math.abs(south.x - 50) < TRIG, 'x stays centered');
  assert.ok(Math.abs((north.y - 50) + (south.y - 50)) < TRIG, `north.y=${north.y} south.y=${south.y}`);
});

test('east/west symmetry: x mirrors about 50 for equal-and-opposite longitude offsets', () => {
  const dLngDeg = lngOffsetDegForMetres(RADIUS * 0.5, ORIGIN_LAT);
  const east = projectToPreview(ORIGIN_LAT, ORIGIN_LNG, ORIGIN_LAT, ORIGIN_LNG + dLngDeg, RADIUS);
  const west = projectToPreview(ORIGIN_LAT, ORIGIN_LNG, ORIGIN_LAT, ORIGIN_LNG - dLngDeg, RADIUS);
  assert.ok(Math.abs(east.y - 50) < TRIG && Math.abs(west.y - 50) < TRIG, 'y stays centered');
  assert.ok(Math.abs((east.x - 50) + (west.x - 50)) < TRIG, `east.x=${east.x} west.x=${west.x}`);
});
