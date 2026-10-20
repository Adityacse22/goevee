import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Server } from 'node:http';
import type { DiscoveryProviderPort } from '../server/services/discovery/google-places.provider';

// The controller reads server config; keep production-only checks out of unit tests.
process.env.NODE_ENV = 'test';
const { default: discoveryRoutes } = await import('../server/routes/discovery.routes');
const { setDiscoveryServiceForTests } = await import('../server/controllers/discovery.controller');
const { createDiscoveryService } = await import('../server/services/discovery/discovery.service');
const { discoveryError } = await import('../server/services/discovery/errors');

let failNearby = false;
const provider: DiscoveryProviderPort = {
  async searchNearby() {
    if (failNearby) throw discoveryError('PROVIDER_QUOTA');
    return [{ id: 'ChIJ_route_station', displayName: { text: 'Route Station' }, location: { latitude: 28.62, longitude: 77.21 }, businessStatus: 'OPERATIONAL' }];
  },
  async autocomplete() { return [{ placeId: 'ChIJ_route_place1', structuredFormat: { mainText: { text: 'Connaught Place' }, secondaryText: { text: 'New Delhi, Delhi, India' } }, types: ['sublocality'] }]; },
  async placeDetails(placeId) { return placeId === 'ChIJ_missing_place' ? {} : { id: placeId, location: { latitude: 28.63, longitude: 77.22 }, formattedAddress: 'Connaught Place, New Delhi', types: ['sublocality'] }; },
  async reverseGeocode() { return [{ address_components: [{ long_name: 'Connaught Place', types: ['sublocality_level_1'] }, { long_name: 'New Delhi', types: ['locality'] }] }]; },
};
setDiscoveryServiceForTests(createDiscoveryService({ provider }));

async function withApp(run: (url: string) => Promise<void>) {
  const app = express();
  app.use(express.json({ limit: '16kb' }));
  app.use('/api/v1/discovery', discoveryRoutes);
  let server: Server;
  await new Promise<void>(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  const address = server!.address();
  assert.ok(address && typeof address !== 'string');
  try { await run(`http://127.0.0.1:${address.port}/api/v1/discovery`); }
  finally { await new Promise<void>(resolve => server!.close(() => resolve())); }
}

const post = (url: string, body: unknown) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('station search validates radius on the server and rejects anything off the published list', async () => {
  await withApp(async base => {
    for (const body of [
      { lat: 28.6, lng: 77.2, radiusKm: 25 },
      { lat: 28.6, lng: 77.2, radiusKm: 150 },
      { lat: 28.6, lng: 77.2, radiusKm: '10' },
      { lat: 91, lng: 77.2, radiusKm: 10 },
      { lat: 28.6, lng: 181, radiusKm: 10 },
      { lat: 28.6, lng: 77.2 },
      { lat: 28.6, lng: 77.2, radiusKm: 10, url: 'https://evil.example' },
    ]) {
      const response = await post(`${base}/stations/search`, body);
      assert.equal(response.status, 400, JSON.stringify(body));
      const payload = await response.json();
      assert.equal(payload.status, 'error');
      assert.equal(payload.code, 'INVALID_REQUEST');
      assert.ok(!JSON.stringify(payload).includes('28.6'), 'errors never echo coordinates');
    }
    for (const radiusKm of [10, 20, 30, 50, 100]) {
      const response = await post(`${base}/stations/search`, { lat: 28.6139, lng: 77.209, radiusKm });
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.equal(payload.radiusKm, radiusKm);
      assert.equal(payload.status, 'ok');
      assert.equal(payload.stations[0].booking.bookable, false);
    }
  });
});

test('provider failures are explicit errors, never an empty result', async () => {
  await withApp(async base => {
    failNearby = true;
    try {
      const response = await post(`${base}/stations/search`, { lat: 28.6139, lng: 77.209, radiusKm: 10 });
      assert.equal(response.status, 503);
      const payload = await response.json();
      assert.deepEqual({ status: payload.status, code: payload.code, retryable: payload.retryable }, { status: 'error', code: 'PROVIDER_QUOTA', retryable: true });
      assert.equal(payload.stations, undefined);
    } finally {
      failNearby = false;
    }
  });
});

test('autocomplete, location resolve, station details and reverse geocode contracts', async () => {
  await withApp(async base => {
    const suggestions = await (await post(`${base}/autocomplete`, { input: 'connaught', sessionToken: 'abcdef12-3456' })).json();
    assert.equal(suggestions.status, 'ok');
    assert.deepEqual(suggestions.suggestions[0], { placeId: 'ChIJ_route_place1', primaryText: 'Connaught Place', secondaryText: 'New Delhi, Delhi, India', types: ['sublocality'] });
    assert.equal((await post(`${base}/autocomplete`, { input: '', sessionToken: 'abcdef12-3456' })).status, 400);
    assert.equal((await post(`${base}/autocomplete`, { input: 'x'.repeat(121), sessionToken: 'abcdef12-3456' })).status, 400);
    assert.equal((await post(`${base}/autocomplete`, { input: 'delhi', sessionToken: 'bad token!' })).status, 400);

    const resolved = await (await fetch(`${base}/locations/ChIJ_route_place1?sessionToken=abcdef12-3456`)).json();
    assert.deepEqual(resolved.location.location, { lat: 28.63, lng: 77.22 });
    assert.equal((await fetch(`${base}/locations/ChIJ_missing_place`)).status, 404);
    assert.equal((await fetch(`${base}/locations/bad%2F..%2Fid`)).status, 400);

    const details = await (await fetch(`${base}/stations/ChIJ_route_place1`)).json();
    assert.equal(details.status, 'ok');
    assert.equal(details.station.id, 'ChIJ_route_place1');
    assert.equal(details.station.distanceMeters, null);

    const reverse = await (await post(`${base}/reverse-geocode`, { lat: 28.63, lng: 77.22 })).json();
    assert.deepEqual(reverse, { status: 'ok', label: 'Connaught Place, New Delhi' });
  });
});

test('station search is rate limited per client', async () => {
  await withApp(async base => {
    let limited = false;
    for (let index = 0; index < 40 && !limited; index++) {
      limited = (await post(`${base}/stations/search`, { lat: 1, lng: 1, radiusKm: 10 })).status === 429;
    }
    assert.ok(limited);
  });
});
