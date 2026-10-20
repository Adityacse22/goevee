import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptDiscoveryStation } from '../src/lib/discovery/adapter';
import { applyFilters, badgeState, DEFAULT_FILTERS, freshness } from '../src/lib/filters';
import type { DiscoveryStation } from '../shared/discovery';

const base: DiscoveryStation = {
  id: 'ChIJ_adapter_01',
  provider: 'google_places',
  name: 'Adapter Station',
  address: 'Ring Road, New Delhi',
  location: { lat: 28.6, lng: 77.2 },
  distanceMeters: 2449.7,
  operationalStatus: 'operational',
  connectors: [],
  connectorCount: null,
  pricing: { known: false },
  booking: { bookable: false, reason: 'no_verified_inventory' },
  googleMapsUri: null,
  attributions: [],
  retrievedAt: '2026-05-01T06:00:00.000Z',
};

test('unknown provider fields stay unknown in the view model', () => {
  const station = adaptDiscoveryStation(base);
  assert.equal(station.priceKnown, false);
  assert.equal(station.etaMin, null, 'no fabricated drive time');
  assert.deepEqual(station.hours, { type: 'unknown' });
  assert.equal(station.supportsRealtime, false);
  assert.equal(station.distanceKm, 2.4497, 'straight-line, unrounded, no road factor');
  assert.equal(station.discovery?.bookable, false);
  assert.equal(badgeState(station, Date.parse(base.retrievedAt)), 'unknown');
  assert.equal(freshness(station, Date.parse(base.retrievedAt)).kind, 'unavailable');
});

test('connector groups expand honestly: published availability only, no guessed current or power', () => {
  const now = Date.parse('2026-05-01T06:05:00.000Z');
  const station = adaptDiscoveryStation({
    ...base,
    connectors: [
      { kind: 'CCS2', maxPowerKw: 60, count: 3, availableCount: 1, outOfServiceCount: 1, availabilityUpdatedAt: '2026-05-01T06:04:00.000Z' },
      { kind: 'GBT', maxPowerKw: null, count: 2, availableCount: null, outOfServiceCount: null, availabilityUpdatedAt: null },
    ],
  });
  assert.deepEqual(station.connectors.map(c => [c.type, c.current, c.maxPowerKw, c.status]), [
    ['CCS2', 'DC', 60, 'AVAILABLE'],
    ['CCS2', 'DC', 60, 'OUTOFORDER'],
    ['CCS2', 'DC', 60, 'CHARGING'],
    ['GBT', null, null, 'UNKNOWN'],
    ['GBT', null, null, 'UNKNOWN'],
  ]);
  assert.equal(station.supportsRealtime, true);
  assert.equal(station.lastUpdated, '2026-05-01T06:04:00.000Z', 'freshness follows the provider timestamp');
  assert.equal(freshness(station, now).kind, 'live');
  // Default filters keep every station; "Available now" keeps only published availability.
  const unknown = adaptDiscoveryStation(base);
  assert.equal(applyFilters([station, unknown], DEFAULT_FILTERS, now).length, 2);
  assert.deepEqual(applyFilters([station, unknown], { ...DEFAULT_FILTERS, available: true }, now).map(s => s.id), [station.id]);
});
