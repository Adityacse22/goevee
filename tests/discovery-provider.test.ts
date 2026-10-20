import test from 'node:test';
import assert from 'node:assert/strict';
import { createGooglePlacesProvider, NEARBY_FIELD_MASK, NEARBY_FIELD_MASK_BASIC } from '../server/services/discovery/google-places.provider';
import { normalizeGooglePlace } from '../server/services/discovery/google-normalize';

const KEY = 'test-key-not-real';
type Call = { url: string; init: RequestInit };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function fakeFetch(responses: Array<Response | Error | (() => Promise<Response>)>) {
  const calls: Call[] = [];
  const impl = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const next = responses.shift();
    if (!next) throw new Error('unexpected call');
    if (next instanceof Error) throw next;
    return typeof next === 'function' ? next() : next;
  }) as typeof fetch;
  return { impl, calls };
}

const signal = () => AbortSignal.timeout(10_000);

test('nearby search sends key and field mask as headers, DISTANCE rank, ≤ 50 km circle', async () => {
  const { impl, calls } = fakeFetch([json(200, { places: [{ id: 'ChIJ_test_1234' }] })]);
  const provider = createGooglePlacesProvider({ apiKey: KEY, fetchImpl: impl });
  const places = await provider.searchNearby({ center: { lat: 28.6, lng: 77.2 }, radiusMeters: 10_000, maxResults: 20 }, signal());
  assert.equal(places.length, 1);
  assert.equal(calls[0].url, 'https://places.googleapis.com/v1/places:searchNearby');
  assert.ok(!calls[0].url.includes(KEY));
  const headers = calls[0].init.headers as Record<string, string>;
  assert.equal(headers['X-Goog-Api-Key'], KEY);
  assert.equal(headers['X-Goog-FieldMask'], NEARBY_FIELD_MASK);
  const body = JSON.parse(String(calls[0].init.body));
  assert.deepEqual(body.includedTypes, ['electric_vehicle_charging_station']);
  assert.equal(body.rankPreference, 'DISTANCE');
  assert.equal(body.maxResultCount, 20);
  assert.equal(body.locationRestriction.circle.radius, 10_000);
});

test('connector fields can be dropped from the list mask to lower the billed SKU', async () => {
  const { impl, calls } = fakeFetch([json(200, { places: [] })]);
  await createGooglePlacesProvider({ apiKey: KEY, fetchImpl: impl, includeEvChargeOptions: false }).searchNearby({ center: { lat: 0, lng: 0 }, radiusMeters: 1000, maxResults: 20 }, signal());
  assert.equal((calls[0].init.headers as Record<string, string>)['X-Goog-FieldMask'], NEARBY_FIELD_MASK_BASIC);
  assert.ok(!NEARBY_FIELD_MASK_BASIC.includes('evChargeOptions'));
});

test('retries once on 5xx, then succeeds', async () => {
  const { impl, calls } = fakeFetch([json(503, { error: { status: 'UNAVAILABLE' } }), json(200, { places: [] })]);
  const provider = createGooglePlacesProvider({ apiKey: KEY, fetchImpl: impl, retryBaseDelayMs: 1 });
  assert.deepEqual(await provider.searchNearby({ center: { lat: 0, lng: 0 }, radiusMeters: 1000, maxResults: 20 }, signal()), []);
  assert.equal(calls.length, 2);
});

test('classifies config, quota, timeout and missing-key failures with bounded attempts', async () => {
  const request = { center: { lat: 0, lng: 0 }, radiusMeters: 1000, maxResults: 20 };
  const config = fakeFetch([json(403, { error: { status: 'PERMISSION_DENIED', details: [{ reason: 'API_KEY_INVALID' }] } })]);
  await assert.rejects(createGooglePlacesProvider({ apiKey: KEY, fetchImpl: config.impl }).searchNearby(request, signal()), { code: 'PROVIDER_CONFIG' });
  assert.equal(config.calls.length, 1, 'config errors are not retried');

  const invalidKey = fakeFetch([json(400, { error: { status: 'INVALID_ARGUMENT', message: 'API key not valid. Please pass a valid API key.' } })]);
  await assert.rejects(createGooglePlacesProvider({ apiKey: KEY, fetchImpl: invalidKey.impl }).searchNearby(request, signal()), { code: 'PROVIDER_CONFIG' });

  const quota = fakeFetch([json(429, { error: { status: 'RESOURCE_EXHAUSTED' } }), json(429, { error: { status: 'RESOURCE_EXHAUSTED' } })]);
  await assert.rejects(createGooglePlacesProvider({ apiKey: KEY, fetchImpl: quota.impl, retryBaseDelayMs: 1 }).searchNearby(request, signal()), { code: 'PROVIDER_QUOTA' });
  assert.equal(quota.calls.length, 2, 'one retry, then stop');

  const hang = () => new Promise<Response>(() => undefined);
  const slow = fakeFetch([hang, hang]);
  const timedOut = createGooglePlacesProvider({ apiKey: KEY, fetchImpl: (url, init) => {
    void slow.impl(url, init);
    return new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('timed out', 'TimeoutError'))));
  }, attemptTimeoutMs: 20, retryBaseDelayMs: 1 });
  await assert.rejects(timedOut.searchNearby(request, signal()), { code: 'PROVIDER_TIMEOUT' });

  const missing = fakeFetch([]);
  await assert.rejects(createGooglePlacesProvider({ apiKey: '', fetchImpl: missing.impl }).searchNearby(request, signal()), { code: 'PROVIDER_CONFIG' });
  assert.equal(missing.calls.length, 0);
});

test('autocomplete uses session tokens, no India-only restriction, and optional bias', async () => {
  const { impl, calls } = fakeFetch([json(200, { suggestions: [{ placePrediction: { placeId: 'ChIJ_cp_123456', structuredFormat: { mainText: { text: 'Connaught Place' }, secondaryText: { text: 'New Delhi, Delhi, India' } } } }] })]);
  const provider = createGooglePlacesProvider({ apiKey: KEY, fetchImpl: impl });
  const predictions = await provider.autocomplete({ text: 'connaught', sessionToken: 'session-token-1', bias: null, languageCode: null }, signal());
  assert.equal(predictions.length, 1);
  const body = JSON.parse(String(calls[0].init.body));
  assert.equal(body.sessionToken, 'session-token-1');
  assert.equal(body.includedRegionCodes, undefined);
  assert.equal(body.locationRestriction, undefined);
});

test('reverse geocode maps Geocoding API statuses', async () => {
  const denied = fakeFetch([json(200, { status: 'REQUEST_DENIED', results: [] })]);
  await assert.rejects(createGooglePlacesProvider({ apiKey: KEY, fetchImpl: denied.impl }).reverseGeocode({ lat: 1, lng: 2 }, signal()), { code: 'PROVIDER_CONFIG' });
  const none = fakeFetch([json(200, { status: 'ZERO_RESULTS', results: [] })]);
  assert.deepEqual(await createGooglePlacesProvider({ apiKey: KEY, fetchImpl: none.impl }).reverseGeocode({ lat: 1, lng: 2 }, signal()), []);
});

test('normaliser keeps provider IDs, coordinates and provenance; rejects records without them', () => {
  const retrievedAt = '2026-05-01T00:00:00.000Z';
  const station = normalizeGooglePlace({
    id: 'ChIJ_station_01',
    displayName: { text: 'Tata Power EZ Charge' },
    formattedAddress: 'Sector 62, Noida',
    location: { latitude: 28.62, longitude: 77.36 },
    businessStatus: 'OPERATIONAL',
    googleMapsUri: 'https://maps.google.com/?cid=1',
    evChargeOptions: { connectorCount: 2, connectorAggregation: [{ type: 'EV_CONNECTOR_TYPE_CCS_COMBO_2', count: 2, maxChargeRateKw: 60, availableCount: 1, outOfServiceCount: 0, availabilityLastUpdateTime: '2026-05-01T00:00:00Z' }] },
    attributions: [{ provider: 'Operator feed', providerUri: 'javascript:alert(1)' }],
  }, retrievedAt);
  assert.ok(station);
  assert.equal(station.id, 'ChIJ_station_01');
  assert.deepEqual(station.location, { lat: 28.62, lng: 77.36 });
  assert.equal(station.retrievedAt, retrievedAt);
  assert.deepEqual(station.connectors[0], { kind: 'CCS2', maxPowerKw: 60, count: 2, availableCount: 1, outOfServiceCount: 0, availabilityUpdatedAt: '2026-05-01T00:00:00.000Z' });
  assert.deepEqual(station.attributions, [{ provider: 'Operator feed', providerUri: null }], 'non-https attribution links are dropped');
  // Availability that does not add up is treated as unknown.
  const inconsistent = normalizeGooglePlace({ id: 'ChIJ_station_02', location: { latitude: 1, longitude: 1 }, evChargeOptions: { connectorAggregation: [{ count: 1, availableCount: 3 }] } }, retrievedAt);
  assert.equal(inconsistent?.connectors[0].availableCount, null);
  assert.equal(normalizeGooglePlace({ id: 'ChIJ_station_03', location: { latitude: 91, longitude: 0 } }, retrievedAt), null);
  assert.equal(normalizeGooglePlace({ location: { latitude: 1, longitude: 1 } }, retrievedAt), null);
  assert.equal(normalizeGooglePlace({ id: 'bad/../id', location: { latitude: 1, longitude: 1 } }, retrievedAt), null);
});
