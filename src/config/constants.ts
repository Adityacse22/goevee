/**
 * CONFIG — Application-wide constants.
 * Centralises magic numbers & option arrays that were previously scattered
 * across Map.tsx, BookingForm.tsx, BookingModal.tsx, and StationList.tsx.
 */

// ─── Map Defaults ────────────────────────────────────────────────────────────

/** Default map centre (Samalkha, Haryana) used when no location is available. */
export const DEFAULT_CENTER = { lat: 28.9931, lng: 76.9507 } as const;

/** Default search radius in metres for nearby EV charger lookups. */
export const DEFAULT_RADIUS = 15_000;

/** Radius options exposed in the map UI. */
export const RADIUS_OPTIONS = [
  { value: 10_000, label: '10 km' },
  { value: 15_000, label: '15 km' },
  { value: 25_000, label: '25 km' },
  { value: 50_000, label: '50 km' },
] as const;

// ─── Booking Options ─────────────────────────────────────────────────────────

/** Available session durations (minutes) shown in BookingForm. */
export const BOOKING_DURATIONS_MINUTES = [30, 60, 90, 120] as const;

/** Vehicle types offered in the booking flow. */
export const VEHICLE_TYPES = [
  'Tesla',
  'Nissan Leaf',
  'Chevrolet Bolt',
  'BMW i3',
  'Ford Mustang Mach-E',
  'Other',
] as const;

/** Pre-defined time slots for the quick-booking modal. */
export const BOOKING_TIME_SLOTS = [
  { label: '6:00 AM', value: '06:00' },
  { label: '8:00 AM', value: '08:00' },
  { label: '10:00 AM', value: '10:00' },
  { label: '12:00 PM', value: '12:00' },
  { label: '2:00 PM', value: '14:00' },
  { label: '4:00 PM', value: '16:00' },
  { label: '6:00 PM', value: '18:00' },
  { label: '8:00 PM', value: '20:00' },
  { label: '10:00 PM', value: '22:00' },
] as const;

/** Duration options for the quick-booking modal. */
export const BOOKING_DURATION_OPTIONS = [
  { label: '30 min', value: 0.5 },
  { label: '1 hour', value: 1 },
  { label: '2 hours', value: 2 },
  { label: '3 hours', value: 3 },
] as const;



// ─── Misc ────────────────────────────────────────────────────────────────────

/** Mobile breakpoint used by the useIsMobile hook. */
export const MOBILE_BREAKPOINT = 768;
