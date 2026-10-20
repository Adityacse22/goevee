/**
 * Demo dataset for the GoEvee app screens (Nearby, Map, Station details, Book
 * slot, Profile, Vehicles, Updates). This is clearly-labelled sample data for a
 * product UI build — it is NOT live provider data and must not be presented as
 * real-time truth. The real charger discovery flow (src/lib/discovery) is
 * separate and untouched.
 */

export type ConnectorStandard = 'CCS2' | 'Type 2 AC' | 'CHAdeMO' | 'Dual CCS2';

export interface DemoConnector {
  standard: ConnectorStandard;
  current: 'AC' | 'DC';
  maxKw: number;
  tariffPerKwh: number;
  gunsTotal: number;
  gunsFree: number;
  recommended?: boolean;
}

export interface DemoStation {
  id: string;
  name: string;
  operator: string;
  verified: boolean;
  publicStation: boolean;
  rating: number;
  reviews: number;
  address: string;
  shortAddress: string;
  imageUrl: string;
  peakKw: number;
  distanceKm: number;
  driveMin: number;
  baysTotal: number;
  baysFree: number;
  open24x7: boolean;
  amenitiesNearby: boolean;
  liveTelemetry: boolean;
  tariffFrom: number;
  connectors: DemoConnector[];
  coords: { lat: number; lng: number };
  /** 0–100 position inside the illustrative map SVG. */
  pin: { x: number; y: number };
}

const img = '/mock/stations/placeholder.svg';

export const DEMO_LOCATION = { label: 'Sector 18, Noida', radiusKm: 5 as const };

export const DEMO_STATIONS: DemoStation[] = [
  {
    id: 'chargehub-city-centre', name: 'ChargeHub City Centre', operator: 'ChargeHub India',
    verified: true, publicStation: true, rating: 4.8, reviews: 184,
    address: 'DLF Mall of India, Basement 2 (P4 Pillar), Sector 18, Noida',
    shortAddress: 'DLF Mall of India, Sec 18, Noida', imageUrl: img,
    peakKw: 60, distanceKm: 2.4, driveMin: 6, baysTotal: 4, baysFree: 3,
    open24x7: true, amenitiesNearby: true, liveTelemetry: true, tariffFrom: 14,
    coords: { lat: 28.5705, lng: 77.3261 }, pin: { x: 44, y: 40 },
    connectors: [
      { standard: 'CCS2', current: 'DC', maxKw: 60, tariffPerKwh: 14, gunsTotal: 2, gunsFree: 1, recommended: true },
      { standard: 'Type 2 AC', current: 'AC', maxKw: 22, tariffPerKwh: 16.5, gunsTotal: 2, gunsFree: 2 },
    ],
  },
  {
    id: 'tata-ez-charge-hub', name: 'Tata EZ Charge Hub', operator: 'Tata Power',
    verified: true, publicStation: true, rating: 4.6, reviews: 97,
    address: 'DLF Mall of India, B2 (P4), Sector 18, Noida',
    shortAddress: 'DLF Mall of India, B2 (P4), Sec 18', imageUrl: img,
    peakKw: 60, distanceKm: 1.2, driveMin: 4, baysTotal: 4, baysFree: 3,
    open24x7: true, amenitiesNearby: true, liveTelemetry: true, tariffFrom: 16.5,
    coords: { lat: 28.5698, lng: 77.3245 }, pin: { x: 30, y: 52 },
    connectors: [
      { standard: 'CCS2', current: 'DC', maxKw: 60, tariffPerKwh: 16.5, gunsTotal: 2, gunsFree: 2, recommended: true },
      { standard: 'Type 2 AC', current: 'AC', maxKw: 22, tariffPerKwh: 16.5, gunsTotal: 2, gunsFree: 1 },
    ],
  },
  {
    id: 'jio-bp-pulse-ultra', name: 'Jio-bp pulse Ultra Hub', operator: 'Jio-bp',
    verified: true, publicStation: true, rating: 4.4, reviews: 212,
    address: 'Advant Navis Business Park, Sector 142, Noida',
    shortAddress: 'Advant Navis Business Park, Sector 1…', imageUrl: img,
    peakKw: 120, distanceKm: 2.8, driveMin: 7, baysTotal: 6, baysFree: 5,
    open24x7: true, amenitiesNearby: true, liveTelemetry: true, tariffFrom: 18,
    coords: { lat: 28.5012, lng: 77.4001 }, pin: { x: 68, y: 30 },
    connectors: [
      { standard: 'Dual CCS2', current: 'DC', maxKw: 120, tariffPerKwh: 18, gunsTotal: 4, gunsFree: 3, recommended: true },
      { standard: 'CHAdeMO', current: 'DC', maxKw: 50, tariffPerKwh: 18, gunsTotal: 2, gunsFree: 2 },
    ],
  },
  {
    id: 'zeon-expressway', name: 'Zeon Charging Expressway', operator: 'Zeon',
    verified: false, publicStation: true, rating: 4.2, reviews: 54,
    address: 'Noida–Greater Noida Expressway, Sector 142',
    shortAddress: 'Noida–Greater Noida Expressway', imageUrl: img,
    peakKw: 50, distanceKm: 3.6, driveMin: 9, baysTotal: 3, baysFree: 1,
    open24x7: false, amenitiesNearby: false, liveTelemetry: false, tariffFrom: 15,
    coords: { lat: 28.5101, lng: 77.4102 }, pin: { x: 72, y: 60 },
    connectors: [
      { standard: 'CCS2', current: 'DC', maxKw: 50, tariffPerKwh: 15, gunsTotal: 2, gunsFree: 0, recommended: true },
      { standard: 'Type 2 AC', current: 'AC', maxKw: 11, tariffPerKwh: 13, gunsTotal: 1, gunsFree: 1 },
    ],
  },
];

export const RADIUS_OPTIONS = [5, 10, 15] as const;
export type DemoRadius = (typeof RADIUS_OPTIONS)[number];

export function freePercent(station: DemoStation): number {
  return station.baysTotal ? Math.round((station.baysFree / station.baysTotal) * 100) : 0;
}

export function getDemoStation(id: string): DemoStation | undefined {
  return DEMO_STATIONS.find(station => station.id === id);
}

/** Google Maps directions hand-off (same contract as the real discovery flow). */
export function directionsUrl(station: DemoStation, origin?: { lat: number; lng: number }): string {
  const params = new URLSearchParams({ api: '1' });
  if (origin) params.set('origin', `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}`);
  params.set('destination', `${station.coords.lat.toFixed(6)},${station.coords.lng.toFixed(6)}`);
  params.set('travelmode', 'driving');
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}


/** The driver's active vehicle (demo). Used by Station details + Book Slot. */
export interface DemoVehicle {
  name: string;
  pack: string;
  socPercent: number;
  connector: 'CCS2';
  native: boolean;
}

export const ACTIVE_VEHICLE: DemoVehicle = {
  name: 'Tata Nexon EV Max',
  pack: '40.5 kWh Pack',
  socPercent: 68,
  connector: 'CCS2',
  native: true,
};

/** A bookable connector gun on the station details screen. */
export interface DemoGun {
  id: string;
  label: string;
  kind: 'DC Fast' | 'AC';
  maxKw: number;
  tariffPerKwh: number;
  gunsTotal: number;
  gunsFree: number;
  recommended?: boolean;
}

export const STATION_GUNS: DemoGun[] = [
  { id: 'ccs2-a', label: 'CCS2 Gun A (DC Fast)', kind: 'DC Fast', maxKw: 60, tariffPerKwh: 18, gunsTotal: 4, gunsFree: 2, recommended: true },
  { id: 'type2-b', label: 'Type 2 Gun B', kind: 'AC', maxKw: 22, tariffPerKwh: 13, gunsTotal: 2, gunsFree: 2 },
];

/** A time slot in the booking grid. */
export interface DemoSlot {
  id: string;
  start: string;
  end: string;
  state: 'available' | 'selected' | 'booked' | 'fillingFast' | 'peak';
  note?: string;
}

export const BOOKING_DATES = [
  { id: 'd0', dow: 'TODAY', day: '24 Oct' },
  { id: 'd1', dow: 'TOMORROW', day: '25 Oct' },
  { id: 'd2', dow: 'FRI', day: '26 Oct' },
  { id: 'd3', dow: 'SAT', day: '27 Oct' },
] as const;

export const BOOKING_SLOTS: DemoSlot[] = [
  { id: 's1', start: '02:30 PM', end: '03:00 PM', state: 'booked', note: 'Booked' },
  { id: 's2', start: '03:00 PM', end: '03:30 PM', state: 'selected', note: 'Selected' },
  { id: 's3', start: '03:30 PM', end: '04:00 PM', state: 'available', note: 'Fast check-in' },
  { id: 's4', start: '04:00 PM', end: '04:30 PM', state: 'available', note: 'Fast check-in' },
  { id: 's5', start: '04:30 PM', end: '05:00 PM', state: 'fillingFast', note: '1 bay left' },
  { id: 's6', start: '05:00 PM', end: '05:30 PM', state: 'peak', note: 'Peak hour' },
];
