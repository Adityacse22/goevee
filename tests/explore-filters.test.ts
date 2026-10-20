import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_VEHICLES, createMockStations } from '../src/lib/mock-data';
import {
  DEFAULT_FILTERS,
  FAST_MIN_KW,
  PRICE_CEILING,
  applyFilters,
  availabilityLevel,
  badgeState,
  chipConnectorFor,
  displayConnector,
  freshness,
  isOpenNow,
  powerTier,
  sortStations,
} from '../src/lib/filters';
import { formatAddress, formatClockIST, formatDistance, formatEta, formatINR, formatTime12h } from '../src/lib/format';
import { filterQuery, parseFilters, parseSort } from '../src/lib/url-state';
import type { Filters, Station } from '../src/lib/types';

/** "Available now" became opt-in (most provider listings publish no live availability); these scenarios exercise it ON. */
const AVAILABLE_NOW: Filters = { ...DEFAULT_FILTERS, available: true };

// 27 Sep 2026, 10:42 AM IST (05:12 UTC) — the reference daytime clock.
const MORNING = Date.UTC(2026, 8, 27, 5, 12);
const nexon = MOCK_VEHICLES.find(vehicle => vehicle.id === 'tata-nexon-ev')!;
const ather = MOCK_VEHICLES.find(vehicle => vehicle.id === 'ather-450x')!;

const names = (stations: Station[]) => stations.map(station => station.name);
const run = (filters: Partial<Filters>, now = MORNING) =>
  names(sortStations(applyFilters(createMockStations(now), { ...AVAILABLE_NOW, ...filters }, now), 'distance'));

test('default view (Available now ON) lists five chargers by distance', () => {
  assert.deepEqual(run({}), ['ChargeHub City Centre', 'VoltPoint Expressway', 'ElectraGo Tech Park', 'GreenWatt Hub', 'SparkLane Galleria']);
});

test('map preview: four nearest are three available pins and one limited (ElectraGo)', () => {
  const stations = sortStations(applyFilters(createMockStations(MORNING), AVAILABLE_NOW, MORNING), 'distance').slice(0, 4);
  assert.deepEqual(stations.map(availabilityLevel), ['available', 'available', 'limited', 'available']);
  assert.equal(stations[2].name, 'ElectraGo Tech Park');
});

test('CCS2 chip removes GreenWatt', () => {
  const result = run({ connector: chipConnectorFor(nexon) });
  assert.equal(chipConnectorFor(nexon), 'CCS2');
  assert.ok(!result.includes('GreenWatt Hub'));
  assert.deepEqual(result, ['ChargeHub City Centre', 'VoltPoint Expressway', 'ElectraGo Tech Park', 'SparkLane Galleria']);
});

test('Fast 60 kW+ leaves ChargeHub, VoltPoint and SparkLane', () => {
  assert.deepEqual(run({ minKw: FAST_MIN_KW }), ['ChargeHub City Centre', 'VoltPoint Expressway', 'SparkLane Galleria']);
});

test('Under ₹15/kWh with Available now leaves ChargeHub, ElectraGo and GreenWatt', () => {
  assert.deepEqual(run({ maxPrice: PRICE_CEILING }), ['ChargeHub City Centre', 'ElectraGo Tech Park', 'GreenWatt Hub']);
});

test('all four chips leave ChargeHub only', () => {
  assert.deepEqual(run({ connector: 'CCS2', minKw: FAST_MIN_KW, maxPrice: PRICE_CEILING }), ['ChargeHub City Centre']);
});

test('Ather 450X relabels the connector chip to LECCS and leaves only SparkLane', () => {
  assert.equal(chipConnectorFor(ather), 'LECCS');
  assert.deepEqual(run({ connector: chipConnectorFor(ather) }), ['SparkLane Galleria']);
});

test('GreenWatt reports a 9-minute-old update, never Live', () => {
  const greenwatt = createMockStations(MORNING).find(station => station.id === 'greenwatt-hub')!;
  assert.deepEqual(freshness(greenwatt, MORNING), { kind: 'recent', minutes: 9 });
  const chargehub = createMockStations(MORNING).find(station => station.id === 'chargehub-city-centre')!;
  assert.deepEqual(freshness(chargehub, MORNING), { kind: 'live' });
  assert.deepEqual(freshness(chargehub, MORNING + 31 * 60_000), { kind: 'unavailable' });
});

test('combined filters must match one connector, not two different ones', () => {
  const station: Station = {
    ...createMockStations(MORNING)[0],
    id: 'split',
    connectors: [
      { id: 'ac', type: 'TYPE2', current: 'AC', maxPowerKw: 22, status: 'AVAILABLE' },
      { id: 'dc', type: 'CCS2', current: 'DC', maxPowerKw: 60, status: 'CHARGING' },
    ],
  };
  assert.equal(applyFilters([station], { ...AVAILABLE_NOW, minKw: 60 }, MORNING).length, 0);
  assert.equal(applyFilters([station], { ...AVAILABLE_NOW, available: false, minKw: 60 }, MORNING).length, 1);
});

test('availability levels and badge states', () => {
  const byId = Object.fromEntries(createMockStations(MORNING).map(station => [station.id, station]));
  assert.equal(availabilityLevel(byId['chargehub-city-centre']), 'available');
  assert.equal(availabilityLevel(byId['electrago-tech-park']), 'limited');
  assert.equal(availabilityLevel(byId['plugpoint-botanical-garden']), 'full');
  assert.equal(availabilityLevel(byId['wattway-pari-chowk']), 'offline');
  assert.equal(badgeState(byId['wattway-pari-chowk'], MORNING), 'offline');
});

test('opening hours are evaluated in IST', () => {
  const daily = { type: 'daily', open: '07:00', close: '23:00' } as const;
  assert.equal(isOpenNow(daily, MORNING), true);
  assert.equal(isOpenNow(daily, Date.UTC(2026, 8, 27, 0, 30)), false); // 6:00 AM IST
  assert.equal(isOpenNow(daily, Date.UTC(2026, 8, 27, 18, 0)), false); // 11:30 PM IST
  assert.equal(isOpenNow({ type: 'daily', open: '22:00', close: '06:00' }, Date.UTC(2026, 8, 27, 18, 0)), true);
});

test('unknown hours are always open (never hide a real-data station)', () => {
  assert.equal(isOpenNow({ type: 'unknown' }, MORNING), true);
});

test('a station with unknown hours is never badged as closed', () => {
  const station: Station = { ...createMockStations(MORNING)[0], hours: { type: 'unknown' } };
  assert.notEqual(badgeState(station, MORNING), 'closed');
});

test('at 11:30 PM IST, closed stations drop out of Available now', () => {
  const night = Date.UTC(2026, 8, 27, 18, 0);
  assert.deepEqual(run({}, night), ['ChargeHub City Centre', 'VoltPoint Expressway', 'SparkLane Galleria']);
});

test('cards describe the connector that satisfied the filters', () => {
  const sparklane = createMockStations(MORNING).find(station => station.id === 'sparklane-galleria')!;
  assert.equal(displayConnector(sparklane, AVAILABLE_NOW, nexon)?.type, 'CCS2');
  assert.equal(displayConnector(sparklane, { ...AVAILABLE_NOW, connector: 'LECCS' }, ather)?.type, 'LECCS');
  assert.equal(powerTier({ current: 'DC', maxPowerKw: 120 }), 'ultra');
  assert.equal(powerTier({ current: 'DC', maxPowerKw: 60 }), 'fast');
  assert.equal(powerTier({ current: 'DC', maxPowerKw: 50 }), 'standard');
  assert.equal(powerTier({ current: 'AC', maxPowerKw: 22 }), 'slow');
});

test('en-IN formatting', () => {
  assert.equal(formatINR(14), '₹14');
  assert.equal(formatINR(14.5), '₹14.50');
  assert.equal(formatINR(125000), '₹1,25,000');
  assert.equal(formatDistance(0.65), '650\u00A0m');
  assert.equal(formatDistance(2.4), '2.4\u00A0km');
  assert.equal(formatEta(6), '6\u00A0min');
  assert.equal(formatEta(65), '1\u00A0hr 5\u00A0min');
  assert.equal(formatTime12h('07:00'), '7\u00A0AM');
  assert.equal(formatTime12h('23:00'), '11\u00A0PM');
  assert.equal(formatClockIST(MORNING), '10:42\u00A0AM');
  const voltpoint = createMockStations(MORNING).find(station => station.id === 'voltpoint-expressway')!;
  assert.equal(formatAddress(voltpoint.address), 'Noida–Greater Noida Expressway');
  assert.equal(formatAddress(createMockStations(MORNING)[0].address), 'DLF Mall, Sector 18, Noida');
});

test('filters round-trip through the URL', () => {
  const filters: Filters = { available: true, connector: 'CCS2', minKw: 60, maxPrice: 15 };
  const query = filterQuery(filters, 'price');
  assert.equal(query, '?available=1&connector=ccs2&minKw=60&maxPrice=15&sort=price');
  const params = new URLSearchParams(query);
  assert.deepEqual(parseFilters(params), filters);
  assert.equal(parseSort(params), 'price');
  assert.equal(parseFilters(new URLSearchParams('available=1')).available, true);
  assert.equal(parseFilters(new URLSearchParams('')).available, false);
  assert.equal(parseFilters(new URLSearchParams('available=0')).available, false);
  assert.equal(filterQuery(DEFAULT_FILTERS, 'distance'), '');
  assert.equal(DEFAULT_FILTERS.available, false);
});

// ---------------------------------------------------------------------------
// Preservation tests (bugfix: explore-real-location-chargers, Task 2 / 3.4).
// These capture the EXISTING mock-path behaviour that must stay byte-for-byte
// identical after the real-data fix. They are observation-first: the asserted
// sort orders / prices were recorded from the current unfixed code. Do NOT
// weaken these — they guard requirement 3.4 (filter/sort + URL sync preserved).
// ---------------------------------------------------------------------------
import { matchesFilters, priceInclGst, sortStations as sortStationsPreserve } from '../src/lib/filters';
import { writeFilters } from '../src/lib/url-state';
import type { SortKey } from '../src/lib/types';

// Every mock station publishes a known price (priceIncludesGst: true), so the
// price filter must be able to exclude them. The cheapest incl-GST price is ₹11.
const CHEAPEST_INCL_GST = 11;

test('preservation 3.4: a maxPrice below the cheapest excludes every known-price mock station', () => {
  const stations = createMockStations(MORNING);
  // Property-style: for ALL mock stations (all price-known), a maxPrice at or
  // below the cheapest price-incl-GST filters each one out individually.
  for (const station of stations) {
    assert.equal(priceInclGst(station) >= CHEAPEST_INCL_GST, true);
    assert.equal(
      matchesFilters(station, { available: false, connector: null, minKw: null, maxPrice: CHEAPEST_INCL_GST }, MORNING),
      false,
      `${station.name} should be excluded by maxPrice=${CHEAPEST_INCL_GST}`,
    );
  }
  // And applied over the whole set, nothing survives.
  assert.deepEqual(
    applyFilters(stations, { available: false, connector: null, minKw: null, maxPrice: CHEAPEST_INCL_GST }, MORNING),
    [],
  );
});

test('preservation 3.4: a maxPrice above the dearest keeps every known-price mock station', () => {
  const stations = createMockStations(MORNING);
  const dearest = Math.max(...stations.map(priceInclGst));
  for (const station of stations) {
    assert.equal(
      matchesFilters(station, { available: false, connector: null, minKw: null, maxPrice: dearest + 1 }, MORNING),
      true,
      `${station.name} should pass maxPrice just above the dearest`,
    );
  }
});

test('preservation 3.4: sort over the full mock set matches the current output for every key', () => {
  const stations = createMockStations(MORNING);
  const observed: Record<SortKey, string[]> = {
    distance: [
      'ChargeHub City Centre',
      'PlugPoint Botanical Garden',
      'VoltPoint Expressway',
      'ElectraGo Tech Park',
      'GreenWatt Hub',
      'SparkLane Galleria',
      'WattWay Pari Chowk',
    ],
    price: [
      'GreenWatt Hub',
      'PlugPoint Botanical Garden',
      'ElectraGo Tech Park',
      'ChargeHub City Centre',
      'VoltPoint Expressway',
      'SparkLane Galleria',
      'WattWay Pari Chowk',
    ],
    power: [
      'WattWay Pari Chowk',
      'VoltPoint Expressway',
      'ChargeHub City Centre',
      'SparkLane Galleria',
      'ElectraGo Tech Park',
      'PlugPoint Botanical Garden',
      'GreenWatt Hub',
    ],
    availability: [
      'GreenWatt Hub',
      'ChargeHub City Centre',
      'VoltPoint Expressway',
      'SparkLane Galleria',
      'ElectraGo Tech Park',
      'PlugPoint Botanical Garden',
      'WattWay Pari Chowk',
    ],
  };
  (Object.keys(observed) as SortKey[]).forEach(key => {
    assert.deepEqual(names(sortStationsPreserve(stations, key)), observed[key], `sort by ${key}`);
  });
});

test('preservation 3.4: sort is pure — the input array is not mutated', () => {
  const stations = createMockStations(MORNING);
  const before = names(stations);
  sortStationsPreserve(stations, 'price');
  sortStationsPreserve(stations, 'power');
  assert.deepEqual(names(stations), before);
});

test('preservation 3.4: the url-state round-trip preserves available/connector/minKw/maxPrice/sort', () => {
  // Property-style across a small matrix of states that exercise each field.
  const sorts: SortKey[] = ['distance', 'price', 'power', 'availability'];
  const states: Filters[] = [
    { available: true, connector: 'CCS2', minKw: 60, maxPrice: 15 },
    { available: false, connector: 'TYPE2', minKw: null, maxPrice: null },
    { available: true, connector: null, minKw: 30, maxPrice: 20 },
    { available: false, connector: 'LECCS', minKw: 150, maxPrice: 11 },
  ];
  for (const filters of states) {
    for (const sort of sorts) {
      const query = filterQuery(filters, sort);
      const params = new URLSearchParams(query);
      assert.deepEqual(parseFilters(params), filters, `filters round-trip for ${query || '(empty)'}`);
      assert.equal(parseSort(params), sort, `sort round-trip for ${query || '(empty)'}`);
    }
  }
});

test('preservation 3.4: writeFilters keeps unrelated query keys and clears defaults', () => {
  const base = new URLSearchParams('foo=bar&available=1&connector=type2&sort=power');
  const next = writeFilters(base, { available: false, connector: null, minKw: null, maxPrice: null }, 'distance');
  // Unrelated keys survive; all default filter/sort keys are dropped.
  assert.equal(next.get('foo'), 'bar');
  assert.equal(next.get('available'), null);
  assert.equal(next.get('connector'), null);
  assert.equal(next.get('minKw'), null);
  assert.equal(next.get('maxPrice'), null);
  assert.equal(next.get('sort'), null);
});

// ---------------------------------------------------------------------------
// Requirement 2.9: a real station with an unknown price (priceKnown === false)
// must never be excluded by the maxPrice filter, while a known-price station
// (priceKnown undefined/true) keeps being excluded exactly as before (3.4).
// ---------------------------------------------------------------------------
test('2.9: a station with priceKnown:false is not excluded by a maxPrice below its price', () => {
  const base = createMockStations(MORNING).find(station => station.id === 'sparklane-galleria')!;
  assert.equal(priceInclGst(base), 18); // priceIncludesGst: true, so incl-GST is 18
  const unknownPrice: Station = { ...base, priceKnown: false };
  assert.equal(
    matchesFilters(unknownPrice, { available: false, connector: null, minKw: null, maxPrice: 11 }, MORNING),
    true,
    'unknown-price station must survive a maxPrice below its placeholder price',
  );
  // Sanity (preserves 3.4): the same station WITHOUT priceKnown:false is still excluded by maxPrice 11.
  assert.equal(
    matchesFilters(base, { available: false, connector: null, minKw: null, maxPrice: 11 }, MORNING),
    false,
    'known-price station is still excluded by maxPrice below its price',
  );
});
