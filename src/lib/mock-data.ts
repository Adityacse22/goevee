/**
 * GoEvee Explore — mock garage, stations and places.
 * All station brands are fictional placeholders; real operator data
 * arrives later from the aggregator API through the same service layer.
 */
import type { Connector, ConnectorType, EvseStatus, Origin, Place, Station, Vehicle } from './types';

const MINUTE = 60_000;

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'tata-nexon-ev',
    displayName: 'Tata Nexon EV',
    segment: '4W',
    imageUrl: '/mock/vehicles/compact-suv.svg',
    connectors: ['CCS2', 'TYPE2'],
    batteryKwh: 45,
    socPercent: 42,
    rangeKm: 180,
  },
  {
    id: 'ather-450x',
    displayName: 'Ather 450X',
    segment: '2W',
    imageUrl: '/mock/vehicles/e-scooter.svg',
    connectors: ['LECCS'],
    batteryKwh: 3.7,
    socPercent: 76,
    rangeKm: 95,
  },
];

export const DEFAULT_VEHICLE_ID = 'tata-nexon-ev';

export const DEFAULT_ORIGIN: Origin = {
  kind: 'default',
  label: 'Sector 62, Noida',
  coords: { lat: 28.627, lng: 77.365 },
};

/** Popular places shown before the user types. Order matters. */
export const POPULAR_PLACE_IDS = ['sector-18-noida', 'cyber-hub-gurugram', 'connaught-place-new-delhi'];

export const MOCK_PLACES: Place[] = [
  { id: 'sector-18-noida', name: 'Sector 18', area: 'Noida', coords: { lat: 28.57, lng: 77.326 } },
  { id: 'cyber-hub-gurugram', name: 'Cyber Hub', area: 'Gurugram', coords: { lat: 28.495, lng: 77.089 } },
  { id: 'connaught-place-new-delhi', name: 'Connaught Place', area: 'New Delhi', coords: { lat: 28.6315, lng: 77.2167 } },
  { id: 'sector-62-noida', name: 'Sector 62', area: 'Noida', coords: { lat: 28.627, lng: 77.365 } },
  { id: 'sector-63-noida', name: 'Sector 63', area: 'Noida', coords: { lat: 28.628, lng: 77.379 } },
  { id: 'botanical-garden-noida', name: 'Botanical Garden', area: 'Noida', coords: { lat: 28.564, lng: 77.334 } },
  { id: 'noida-city-centre', name: 'Noida City Centre', area: 'Noida', coords: { lat: 28.5747, lng: 77.356 } },
  { id: 'pari-chowk-greater-noida', name: 'Pari Chowk', area: 'Greater Noida', coords: { lat: 28.4663, lng: 77.5131 } },
  { id: 'indirapuram-ghaziabad', name: 'Indirapuram', area: 'Ghaziabad', coords: { lat: 28.646, lng: 77.3695 } },
  { id: 'akshardham-new-delhi', name: 'Akshardham', area: 'New Delhi', coords: { lat: 28.6127, lng: 77.2773 } },
];

function connectors(
  stationId: string,
  specs: Array<{ type: ConnectorType; current: 'AC' | 'DC'; kw: number; statuses: EvseStatus[] }>,
): Connector[] {
  let index = 0;
  return specs.flatMap(spec =>
    spec.statuses.map(status => {
      index += 1;
      return { id: `${stationId}-c${index}`, type: spec.type, current: spec.current, maxPowerKw: spec.kw, status };
    }),
  );
}

interface StationSeed extends Omit<Station, 'lastUpdated'> {
  /** How far behind real time the operator feed is when the app loads. */
  feedLagMs: number;
}

const SEEDS: StationSeed[] = [
  {
    id: 'chargehub-city-centre',
    slug: 'chargehub-city-centre',
    name: 'ChargeHub City Centre',
    operator: { id: 'op-chargehub', name: 'ChargeHub' },
    address: { line: 'DLF Mall', locality: 'Sector 18', city: 'Noida' },
    coords: { lat: 28.5672, lng: 77.3211 },
    preview: { x: 46, y: 36 },
    imageUrl: '/mock/stations/chargehub-city-centre.svg',
    connectors: connectors('chargehub-city-centre', [
      { type: 'CCS2', current: 'DC', kw: 60, statuses: ['AVAILABLE', 'AVAILABLE', 'CHARGING', 'AVAILABLE'] },
    ]),
    pricePerKwh: 14,
    priceIncludesGst: true,
    hours: { type: '24x7' },
    distanceKm: 2.4,
    etaMin: 6,
    supportsRealtime: true,
    feedLagMs: 40_000,
  },
  {
    id: 'voltpoint-expressway',
    slug: 'voltpoint-expressway',
    name: 'VoltPoint Expressway',
    operator: { id: 'op-voltpoint', name: 'VoltPoint' },
    address: { line: 'Noida–Greater Noida Expressway', locality: '', city: 'Noida' },
    coords: { lat: 28.5089, lng: 77.3907 },
    preview: { x: 43, y: 88 },
    imageUrl: '/mock/stations/voltpoint-expressway.svg',
    connectors: connectors('voltpoint-expressway', [
      { type: 'CCS2', current: 'DC', kw: 120, statuses: ['CHARGING', 'AVAILABLE', 'CHARGING', 'CHARGING', 'AVAILABLE', 'CHARGING'] },
    ]),
    pricePerKwh: 15,
    priceIncludesGst: true,
    hours: { type: '24x7' },
    distanceKm: 5.8,
    etaMin: 12,
    supportsRealtime: true,
    feedLagMs: 25_000,
  },
  {
    id: 'electrago-tech-park',
    slug: 'electrago-tech-park',
    name: 'ElectraGo Tech Park',
    operator: { id: 'op-electrago', name: 'ElectraGo' },
    address: { line: '', locality: 'Sector 62', city: 'Noida' },
    coords: { lat: 28.6205, lng: 77.3628 },
    preview: { x: 62, y: 52 },
    imageUrl: '/mock/stations/electrago-tech-park.svg',
    connectors: connectors('electrago-tech-park', [
      { type: 'CCS2', current: 'DC', kw: 50, statuses: ['AVAILABLE', 'CHARGING'] },
      { type: 'TYPE2', current: 'AC', kw: 22, statuses: ['CHARGING', 'CHARGING'] },
    ]),
    pricePerKwh: 13,
    priceIncludesGst: true,
    hours: { type: 'daily', open: '07:00', close: '23:00' },
    distanceKm: 7.1,
    etaMin: 15,
    supportsRealtime: true,
    feedLagMs: 55_000,
  },
  {
    id: 'plugpoint-botanical-garden',
    slug: 'plugpoint-botanical-garden',
    name: 'PlugPoint Botanical Garden',
    operator: { id: 'op-plugpoint', name: 'PlugPoint' },
    address: { line: '', locality: 'Sector 38A', city: 'Noida' },
    coords: { lat: 28.5643, lng: 77.3343 },
    preview: { x: 22, y: 40 },
    imageUrl: '/mock/stations/plugpoint-botanical-garden.svg',
    connectors: connectors('plugpoint-botanical-garden', [
      { type: 'CCS2', current: 'DC', kw: 30, statuses: ['CHARGING', 'CHARGING'] },
    ]),
    pricePerKwh: 12,
    priceIncludesGst: true,
    hours: { type: '24x7' },
    distanceKm: 3.9,
    etaMin: 9,
    supportsRealtime: true,
    feedLagMs: 30_000,
  },
  {
    id: 'greenwatt-hub',
    slug: 'greenwatt-hub',
    name: 'GreenWatt Hub',
    operator: { id: 'op-greenwatt', name: 'GreenWatt' },
    address: { line: '', locality: 'Sector 63', city: 'Noida' },
    coords: { lat: 28.628, lng: 77.379 },
    preview: { x: 33, y: 66 },
    imageUrl: '/mock/stations/greenwatt-hub.svg',
    connectors: connectors('greenwatt-hub', [
      { type: 'TYPE2', current: 'AC', kw: 22, statuses: ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE'] },
    ]),
    pricePerKwh: 11,
    priceIncludesGst: true,
    hours: { type: 'daily', open: '06:00', close: '22:00' },
    distanceKm: 8.6,
    etaMin: 17,
    supportsRealtime: true,
    // The operator's feed is delayed: the app opens on a 9-minute-old snapshot.
    feedLagMs: 9 * MINUTE,
  },
  {
    id: 'sparklane-galleria',
    slug: 'sparklane-galleria',
    name: 'SparkLane Galleria',
    operator: { id: 'op-sparklane', name: 'SparkLane' },
    address: { line: '', locality: 'Sector 104', city: 'Noida' },
    coords: { lat: 28.54, lng: 77.371 },
    preview: { x: 86, y: 56 },
    imageUrl: '/mock/stations/sparklane-galleria.svg',
    connectors: connectors('sparklane-galleria', [
      { type: 'CCS2', current: 'DC', kw: 60, statuses: ['AVAILABLE', 'CHARGING'] },
      { type: 'LECCS', current: 'DC', kw: 6, statuses: ['CHARGING', 'AVAILABLE'] },
    ]),
    pricePerKwh: 18,
    priceIncludesGst: true,
    hours: { type: '24x7' },
    distanceKm: 9.4,
    etaMin: 19,
    supportsRealtime: true,
    feedLagMs: 35_000,
  },
  {
    id: 'wattway-pari-chowk',
    slug: 'wattway-pari-chowk',
    name: 'WattWay Pari Chowk',
    operator: { id: 'op-wattway', name: 'WattWay' },
    address: { line: '', locality: '', city: 'Greater Noida' },
    coords: { lat: 28.4663, lng: 77.5131 },
    preview: { x: 93, y: 32 },
    imageUrl: '/mock/stations/wattway-pari-chowk.svg',
    connectors: connectors('wattway-pari-chowk', [
      { type: 'CCS2', current: 'DC', kw: 150, statuses: ['OUTOFORDER', 'INOPERATIVE', 'INOPERATIVE', 'OUTOFORDER'] },
    ]),
    pricePerKwh: 19,
    priceIncludesGst: true,
    hours: { type: '24x7' },
    distanceKm: 21.4,
    etaMin: 32,
    supportsRealtime: true,
    feedLagMs: 50_000,
  },
];

/** Fresh copies of the mock stations, timestamped relative to `now`. */
export function createMockStations(now: number = Date.now()): Station[] {
  return SEEDS.map(({ feedLagMs, ...seed }) => ({
    ...seed,
    connectors: seed.connectors.map(connector => ({ ...connector })),
    lastUpdated: new Date(now - feedLagMs).toISOString(),
  }));
}

export function findMockStation(idOrSlug: string): StationSeed | undefined {
  return SEEDS.find(seed => seed.id === idOrSlug || seed.slug === idOrSlug);
}
