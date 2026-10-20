import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adaptConnector, adaptEVStation } from '../src/lib/station-adapter';
import type { EVStation, StationConnector } from '../src/models/station.model';

const FETCHED_AT = '2026-09-27T05:12:00.000Z';

// ── Fixtures ────────────────────────────────────────────────────────────────

function connector(overrides: Partial<StationConnector> = {}): StationConnector {
  return {
    id: 'place-1-c1',
    station_id: 'place-1',
    connector_type: 'CCS2',
    power_output: 60,
    available: true,
    created_at: '2026-09-27T05:00:00.000Z',
    ...overrides,
  };
}

function evStation(overrides: Partial<EVStation> = {}): EVStation {
  return {
    id: 'place-1',
    name: 'Sector 62 Supercharge Hub',
    location: { lat: 28.627, lng: 77.365 },
    rating: 4.3,
    total_reviews: 12,
    address: '123 Main Rd, Sector 62, Noida, Uttar Pradesh 201309, India',
    price_per_kwh: 15,
    available: true,
    connectors: [connector()],
    distance: 2449, // metres
    isOpen: true,
    ...overrides,
  };
}

// ── Field-by-field mapping ───────────────────────────────────────────────────

test('maps the core fields from a representative EVStation', () => {
  const ev = evStation();
  const s = adaptEVStation(ev, FETCHED_AT);

  assert.equal(s.id, 'place-1');
  assert.equal(s.slug, 'place-1'); // opaque place id reused as slug
  assert.equal(s.name, 'Sector 62 Supercharge Hub');
  assert.deepEqual(s.operator, { id: 'place-1', name: '' });
  assert.deepEqual(s.coords, { lat: 28.627, lng: 77.365 });
  assert.deepEqual(s.preview, { x: 50, y: 50 });
  assert.equal(s.imageUrl, '/mock/stations/placeholder.svg');
  assert.equal(s.priceIncludesGst, true);
  assert.equal(s.lastUpdated, FETCHED_AT); // the passed-in fetch timestamp, not Date.now()
});

test('address: a single formatted line goes to `line`, locality/city empty but line non-empty', () => {
  const ev = evStation({ address: '123 Main Rd, Sector 62, Noida, Uttar Pradesh 201309, India' });
  const s = adaptEVStation(ev, FETCHED_AT);

  assert.equal(s.address.line, '123 Main Rd, Sector 62, Noida, Uttar Pradesh 201309, India');
  assert.equal(s.address.locality, '');
  assert.equal(s.address.city, '');
  assert.ok(s.address.line.length > 0, 'line must be non-empty so the card renders cleanly');
});

// ── Connector type mapping (CCS2 exactness is the hard requirement) ───────────

test('connector type map: CCS2 is exact, plus Type 2 / CHAdeMO / GB/T', () => {
  assert.equal(adaptConnector(connector({ connector_type: 'CCS2' })).type, 'CCS2');
  assert.equal(adaptConnector(connector({ connector_type: 'Type 2' })).type, 'TYPE2');
  assert.equal(adaptConnector(connector({ connector_type: 'CHAdeMO' })).type, 'CHADEMO');
  assert.equal(adaptConnector(connector({ connector_type: 'GB/T' })).type, 'BHARAT_DC001');
});

test('unknown / other connector labels fall back to a safe DC default (CCS2)', () => {
  assert.equal(adaptConnector(connector({ connector_type: 'Other' })).type, 'CCS2');
  assert.equal(adaptConnector(connector({ connector_type: 'Totally Unknown' })).type, 'CCS2');
});

// ── AC/DC inference ───────────────────────────────────────────────────────────

test('AC/DC inference: 60kW CCS2 → DC, 7kW Type 2 → AC', () => {
  const dc = adaptConnector(connector({ connector_type: 'CCS2', power_output: 60 }));
  assert.equal(dc.current, 'DC');
  assert.equal(dc.maxPowerKw, 60);

  const ac = adaptConnector(connector({ connector_type: 'Type 2', power_output: 7 }));
  assert.equal(ac.current, 'AC');
  assert.equal(ac.maxPowerKw, 7);
});

test('maxPowerKw defaults to 0 when Google omits power_output', () => {
  const c = adaptConnector(connector({ connector_type: 'Type 2', power_output: undefined as unknown as number }));
  assert.equal(c.maxPowerKw, 0);
});

// ── Price honesty ─────────────────────────────────────────────────────────────

test('price is never surfaced as known: priceKnown === false', () => {
  const s = adaptEVStation(evStation({ price_per_kwh: 15 }), FETCHED_AT);
  assert.equal(s.priceKnown, false);
  // pricePerKwh is retained for the type contract but must not be treated as known.
  assert.equal(s.pricePerKwh, 15);
});

// ── Hours honesty ─────────────────────────────────────────────────────────────

test('hours degrade honestly to { type: "unknown" }', () => {
  const s = adaptEVStation(evStation(), FETCHED_AT);
  assert.equal(s.hours.type, 'unknown');
});

// ── Real-time support / status honesty ────────────────────────────────────────

test('supportsRealtime is true only when at least one connector has availabilityKnown === true', () => {
  const withLive = adaptEVStation(
    evStation({
      connectors: [
        connector({ id: 'c1', availabilityKnown: false }),
        connector({ id: 'c2', availabilityKnown: true, available: true }),
      ],
    }),
    FETCHED_AT,
  );
  assert.equal(withLive.supportsRealtime, true);

  const allUnknown = adaptEVStation(
    evStation({
      connectors: [
        connector({ id: 'c1', availabilityKnown: false }),
        connector({ id: 'c2' }), // availabilityKnown undefined
      ],
    }),
    FETCHED_AT,
  );
  assert.equal(allUnknown.supportsRealtime, false);
});

test('connector status: unknown availability → UNKNOWN (never fabricated AVAILABLE)', () => {
  assert.equal(adaptConnector(connector({ availabilityKnown: false, available: true })).status, 'UNKNOWN');
  assert.equal(adaptConnector(connector({ available: true })).status, 'UNKNOWN'); // availabilityKnown undefined
});

test('connector status: published availability maps AVAILABLE / CHARGING', () => {
  assert.equal(adaptConnector(connector({ availabilityKnown: true, available: true })).status, 'AVAILABLE');
  assert.equal(adaptConnector(connector({ availabilityKnown: true, available: false })).status, 'CHARGING');
});

// ── Distance conversion (metres → km) ─────────────────────────────────────────

test('metres → km conversion rounds to 0.1 km (2449 m → 2.4 km)', () => {
  assert.equal(adaptEVStation(evStation({ distance: 2449 }), FETCHED_AT).distanceKm, 2.4);
  assert.equal(adaptEVStation(evStation({ distance: 2450 }), FETCHED_AT).distanceKm, 2.5);
  assert.equal(adaptEVStation(evStation({ distance: undefined }), FETCHED_AT).distanceKm, 0);
});

test('etaMin is derived deterministically from distanceKm with a floor of 2', () => {
  // 2.4 km / 26 km/h * 60 ≈ 5.5 → 6
  assert.equal(adaptEVStation(evStation({ distance: 2449 }), FETCHED_AT).etaMin, 6);
  // 0 km → floored to 2
  assert.equal(adaptEVStation(evStation({ distance: 0 }), FETCHED_AT).etaMin, 2);
});

// ── Property-style: unknown availability never yields live/available ──────────

test('property: when no connector has availabilityKnown===true, never supportsRealtime and never a live status', () => {
  const labels = ['CCS2', 'Type 2', 'CHAdeMO', 'GB/T', 'Wall outlet', 'Other', 'CCS1', 'Tesla', 'Unknownish'];
  const powers = [0, 3.3, 7, 22, 25, 50, 60, 120];
  const unknownFlags: Array<boolean | undefined> = [false, undefined];

  for (const connector_type of labels) {
    for (const power_output of powers) {
      for (const availabilityKnown of unknownFlags) {
        // `available` deliberately set true to prove it is NOT trusted when unknown.
        const ev = evStation({
          connectors: [connector({ connector_type, power_output, availabilityKnown, available: true })],
        });
        const s = adaptEVStation(ev, FETCHED_AT);
        assert.equal(s.supportsRealtime, false, `supportsRealtime for ${connector_type}/${power_output}/${availabilityKnown}`);
        for (const c of s.connectors) {
          assert.equal(c.status, 'UNKNOWN', `status for ${connector_type}/${power_output}/${availabilityKnown}`);
          assert.notEqual(c.status, 'AVAILABLE');
          assert.notEqual(c.status, 'CHARGING');
        }
      }
    }
  }
});
