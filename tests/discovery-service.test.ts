import test from 'node:test';
import assert from 'node:assert/strict';
import { destinationPoint, geodesicDistanceMeters, type LatLng } from '../shared/discovery';
import { createDiscoveryService, labelFromGeocode } from '../server/services/discovery/discovery.service';
import { discoveryError } from '../server/services/discovery/errors';
import type { GooglePlace } from '../server/services/discovery/google-normalize';
import type { DiscoveryProviderPort, NearbyRequest } from '../server/services/discovery/google-places.provider';

const CENTRE: LatLng = { lat: 28.6139, lng: 77.209 };
const FIXED_NOW = new Date('2026-05-01T06:30:00.000Z');

const place = (id: string, at: LatLng, extra: Partial<GooglePlace> = {}): GooglePlace => ({
  id,
  displayName: { text: `Station ${id}` },
  formattedAddress: `${id} Road`,
  location: { latitude: at.lat, longitude: at.lng },
  businessStatus: 'OPERATIONAL',
  ...extra,
});

/** Point exactly `km` (WGS84 geodesic) from the centre along `bearing`, found by rescaling the spherical step. */
const at = (km: number, bearing = 90) => {
  const target = km * 1000;
  let step = target;
  let point = destinationPoint(CENTRE, bearing, step);
  for (let i = 0; i < 8 && target > 0; i++) {
    step *= target / geodesicDistanceMeters(CENTRE, point);
    point = destinationPoint(CENTRE, bearing, step);
  }
  return point;
};

/** Fake provider: answers each circle with the world's places inside it, nearest first, max 20. */
function worldProvider(world: GooglePlace[], options: { fail?: (request: NearbyRequest) => boolean } = {}) {
  const calls: NearbyRequest[] = [];
  const provider: DiscoveryProviderPort = {
    async searchNearby(request) {
      calls.push(request);
      if (options.fail?.(request)) throw discoveryError('PROVIDER_UNAVAILABLE');
      return world
        .map(item => ({ item, d: geodesicDistanceMeters(request.center, { lat: item.location!.latitude!, lng: item.location!.longitude! }) }))
        .filter(entry => entry.d <= request.radiusMeters)
        .sort((a, b) => a.d - b.d)
        .slice(0, request.maxResults)
        .map(entry => entry.item);
    },
    async autocomplete() { return []; },
    async placeDetails() { return {}; },
    async reverseGeocode() { return []; },
  };
  return { provider, calls };
}

const service = (provider: DiscoveryProviderPort) => createDiscoveryService({ provider, now: () => FIXED_NOW });

for (const radiusKm of [10, 20, 30, 50] as const) {
  test(`${radiusKm} km: one request at exactly that radius; boundary is exclusive of anything farther`, async () => {
    const world = [place('inside_near', at(1)), place('inside_edge', at(radiusKm - 0.05)), place('outside_edge', at(radiusKm + 0.05, 180))];
    const { provider, calls } = worldProvider(world);
    const result = await service(provider).searchStations(CENTRE, radiusKm);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].radiusMeters, radiusKm * 1000);
    assert.equal(calls[0].maxResults, 20);
    assert.deepEqual(result.stations.map(station => station.id), ['inside_near', 'inside_edge']);
    assert.ok(result.stations.every(station => station.distanceMeters! <= radiusKm * 1000));
    assert.equal(result.status, 'ok');
    assert.equal(result.radiusKm, radiusKm);
    assert.equal(result.distanceKind, 'straight_line');
  });
}

test('distance filter uses unrounded values (9.9996 km in, 10.0004 km out at 10 km)', async () => {
  const { provider } = worldProvider([place('in_by_40cm', at(9.9996)), place('out_by_40cm', at(10.0004, 270))]);
  // The fake provider uses the same geodesic as the service, so pad its radius to return both.
  const padded: DiscoveryProviderPort = { ...provider, searchNearby: (request, signal) => provider.searchNearby({ ...request, radiusMeters: request.radiusMeters + 10 }, signal) };
  const result = await service(padded).searchStations(CENTRE, 10);
  assert.deepEqual(result.stations.map(station => station.id), ['in_by_40cm']);
  assert.ok(result.stations[0].distanceMeters! > 9999.5 && result.stations[0].distanceMeters! < 10_000);
});

test('more than 20 matches: sorted by distance, stable ID tie-break, capped at 20', async () => {
  const world = Array.from({ length: 30 }, (_, index) => place(`p${String(29 - index).padStart(2, '0')}`, at(1 + (index % 15) * 0.5, index < 15 ? 0 : 180)));
  const { provider } = worldProvider(world);
  // Return all 30 regardless of the 20 cap to prove the service caps and orders.
  const unbounded: DiscoveryProviderPort = { ...provider, searchNearby: async () => world };
  const result = await service(unbounded).searchStations(CENTRE, 10);
  assert.equal(result.count, 20);
  assert.equal(result.stations.length, 20);
  for (let index = 1; index < result.stations.length; index++) {
    const previous = result.stations[index - 1];
    const current = result.stations[index];
    assert.ok(previous.distanceMeters! < current.distanceMeters! || (Math.abs(previous.distanceMeters! - current.distanceMeters!) < 1e-6 ? previous.id < current.id : previous.distanceMeters! <= current.distanceMeters!));
  }
});

test('fewer than 20: returns exactly what exists, without padding', async () => {
  const { provider } = worldProvider([place('a_one', at(2)), place('b_two', at(4)), place('c_three', at(6))]);
  const result = await service(provider).searchStations(CENTRE, 20);
  assert.equal(result.count, 3);
  assert.equal(result.coverage.mayOmitCloserStations, false);
});

test('empty is distinct from failure', async () => {
  const { provider } = worldProvider([place('far_away', at(80))]);
  const empty = await service(provider).searchStations(CENTRE, 10);
  assert.equal(empty.status, 'empty');
  assert.equal(empty.count, 0);
  const failing = worldProvider([], { fail: () => true });
  await assert.rejects(service(failing.provider).searchStations(CENTRE, 10), (error: Error & { code?: string }) => error.code === 'PROVIDER_UNAVAILABLE');
});

test('drops permanently closed and invalid records, keeps and flags temporary closures, dedupes by ID', async () => {
  const world = [
    place('closed_forever', at(1), { businessStatus: 'CLOSED_PERMANENTLY' }),
    place('closed_for_now', at(2), { businessStatus: 'CLOSED_TEMPORARILY' }),
    place('no_coords', at(3), { location: { latitude: 999, longitude: 0 } }),
    { ...place('x', at(3)), id: undefined },
    place('dupe_station', at(4)),
    place('dupe_station', at(4)),
  ];
  const { provider } = worldProvider([]);
  const fixed: DiscoveryProviderPort = { ...provider, searchNearby: async () => world };
  const result = await service(fixed).searchStations(CENTRE, 10);
  assert.deepEqual(result.stations.map(station => [station.id, station.operationalStatus]), [['closed_for_now', 'temporarily_closed'], ['dupe_station', 'operational']]);
});

test('100 km dense area: the centre circle alone proves the 20 nearest (1 request)', async () => {
  const world = Array.from({ length: 40 }, (_, index) => place(`dense_${index}`, at(0.5 + index * 0.5, index * 37)));
  const { provider, calls } = worldProvider(world);
  const result = await service(provider).searchStations(CENTRE, 100);
  assert.equal(calls.length, 1);
  assert.equal(result.count, 20);
  assert.equal(result.coverage.strategy, 'multi_circle');
  assert.equal(result.coverage.circlesQueried, 1);
  assert.equal(result.coverage.mayOmitCloserStations, false);
  assert.deepEqual(result.stations.map(station => station.id), world.slice(0, 20).map(item => item.id));
});

test('100 km sparse area: ring circles find stations 50–100 km out, merge, dedupe, and exclude > 100 km', async () => {
  const world = [
    place('near_5', at(5)),
    place('ring_70_north', at(70, 0)),
    place('ring_96_southwest', at(96, 225)),
    place('gap_95_ne', at(95, 22.5)), // between two ring centres
    place('outside_103', at(103, 120)),
  ];
  const { provider, calls } = worldProvider(world);
  const result = await service(provider).searchStations(CENTRE, 100);
  assert.equal(calls.length, 9);
  assert.ok(calls.every(call => call.radiusMeters === 50_000));
  assert.deepEqual(result.stations.map(station => station.id), ['near_5', 'ring_70_north', 'gap_95_ne', 'ring_96_southwest']);
  assert.equal(result.status, 'ok');
  assert.equal(result.coverage.circlesFailed, 0);
});

test('100 km with a failed ring circle is marked partial, never silently complete', async () => {
  const world = [place('near_5', at(5)), place('ring_70_north', at(70, 0))];
  const ringNorth = destinationPoint(CENTRE, 0, 75_000);
  const { provider } = worldProvider(world, { fail: request => geodesicDistanceMeters(request.center, ringNorth) < 1 });
  const result = await service(provider).searchStations(CENTRE, 100);
  assert.equal(result.status, 'partial');
  assert.equal(result.coverage.circlesFailed, 1);
  assert.equal(result.coverage.mayOmitCloserStations, true);
  assert.deepEqual(result.stations.map(station => station.id), ['near_5']);
});

test('100 km with a failed centre circle fails the search (closest results would be missing)', async () => {
  const { provider } = worldProvider([place('near_5', at(5))], { fail: request => geodesicDistanceMeters(request.center, CENTRE) < 1 });
  await assert.rejects(service(provider).searchStations(CENTRE, 100));
});

test('a saturated ring circle that could hide closer stations is reported', async () => {
  // 25 stations clustered around the north ring centre, 2 near the centre.
  const north = destinationPoint(CENTRE, 0, 75_000);
  const world = [place('near_1', at(1)), place('near_2', at(2)),
    ...Array.from({ length: 25 }, (_, index) => place(`cluster_${String(index).padStart(2, '0')}`, destinationPoint(north, index * 14, 500 + index * 1500)))];
  const { provider } = worldProvider(world);
  const result = await service(provider).searchStations(CENTRE, 100);
  assert.equal(result.count, 20);
  assert.ok(result.coverage.saturatedCircles >= 1);
  assert.equal(result.coverage.mayOmitCloserStations, true);
});

test('unknown values stay unknown and provider stations are never bookable', async () => {
  const world = [place('unknowns', at(1), {
    evChargeOptions: { connectorCount: 2, connectorAggregation: [{ type: 'EV_CONNECTOR_TYPE_CCS_COMBO_2', count: 2 }, { type: 'SOMETHING_NEW', count: 1, maxChargeRateKw: 7.4 }] },
  })];
  const { provider } = worldProvider(world);
  const [station] = (await service(provider).searchStations(CENTRE, 10)).stations;
  assert.deepEqual(station.pricing, { known: false });
  assert.deepEqual(station.booking, { bookable: false, reason: 'no_verified_inventory' });
  assert.equal(station.connectors[0].availableCount, null);
  assert.equal(station.connectors[0].maxPowerKw, null);
  assert.equal(station.connectors[1].kind, 'UNKNOWN');
  assert.equal(station.retrievedAt, FIXED_NOW.toISOString());
  assert.equal(station.provider, 'google_places');
});

test('reverse-geocode label prefers "Area, City" and never invents one', () => {
  assert.equal(labelFromGeocode([{ address_components: [
    { long_name: 'Sector 62', types: ['sublocality_level_1', 'sublocality', 'political'] },
    { long_name: 'Noida', types: ['locality', 'political'] },
  ] }]), 'Sector 62, Noida');
  assert.equal(labelFromGeocode([]), null);
  assert.equal(labelFromGeocode([{ address_components: [{ long_name: 'India', types: ['country'] }] }]), null);
});
