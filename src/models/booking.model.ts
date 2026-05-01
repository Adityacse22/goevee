/**
 * MODEL — Booking domain types and pure business logic.
 *
 * Consolidates:
 *   - Booking type        (types/database.ts)
 *   - BookingDetails      (BookingModal.tsx)
 *   - estimatedCost calc  (BookingForm.tsx line 71)
 *   - time conversion     (BookingForm.tsx lines 98-107)
 *   - generateTimeSlots   (BookingForm.tsx lines 43-57)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** Booking row as stored in the `bookings` table. */
export interface Booking {
  id: string;
  user_id: string;
  station_id: string;
  connector_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

/** Shape returned from the quick-book modal confirmation callback. */
export interface BookingDetails {
  stationId: string;
  stationName: string;
  date: string;
  timeSlot: string;
  duration: number;
  connectorType: string;
  estimatedCost: number;
}

/** A single time-slot option for the booking form. */
export interface TimeSlot {
  time: string;
  available: boolean;
}

/** Review row associated with a booking. */
export interface Review {
  id: string;
  user_id: string;
  station_id: string;
  booking_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

// ─── Pure Business Logic ─────────────────────────────────────────────────────

/**
 * Generates half-hourly time slots between 8:00 AM and 8:00 PM.
 * Availability is deterministic per slot index (seeded random).
 * (Extracted from BookingForm.tsx lines 43-57.)
 */
export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startHour = 8;
  const endHour = 20;

  for (let hour = startHour; hour < endHour; hour++) {
    const hourLabel = hour > 12 ? hour - 12 : hour;
    const period = hour >= 12 ? 'PM' : 'AM';

    slots.push({
      time: `${hourLabel}:00 ${period}`,
      available: ((hour * 17 + 7) % 10) > 3, // deterministic per hour
    });
    slots.push({
      time: `${hourLabel}:30 ${period}`,
      available: ((hour * 13 + 3) % 10) > 3,
    });
  }

  return slots;
}

/**
 * Calculates the estimated cost for a charging session.
 *
 * @param pricePerKwh  - station price (₹ per kWh)
 * @param durationMin  - session duration in minutes
 * @param vehicleType  - vehicle model (Tesla draws ~9kW, others ~7kW)
 * @returns formatted cost string (e.g. "126.00")
 *
 * (Extracted from BookingForm.tsx line 71.)
 */
export function calculateEstimatedCost(
  pricePerKwh: number,
  durationMin: number,
  vehicleType: string,
): string {
  const drawKw = vehicleType === 'Tesla' ? 9 : 7;
  return ((pricePerKwh * durationMin) / 60 * drawKw).toFixed(2);
}

/**
 * Converts a 12-hour time string ("2:30 PM") to 24-hour format ("14:30:00").
 * (Extracted from BookingForm.tsx lines 98-103.)
 */
export function convertTo24HourFormat(time12h: string): string {
  const [time, period] = time12h.split(' ');
  const [hoursStr, minutes] = time.split(':');
  let hours = parseInt(hoursStr, 10);

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
}

/**
 * Computes the end time given a start time ("14:30:00") and duration in minutes.
 */
export function computeEndTime(startTime24: string, durationMin: number): string {
  const [hoursStr, minutesStr] = startTime24.split(':');
  const totalMinutes = parseInt(hoursStr, 10) * 60 + parseInt(minutesStr, 10) + durationMin;
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMin = totalMinutes % 60;
  return `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00`;
}

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Checks that all required booking fields are present.
 */
export function validateBookingFields(fields: {
  date: string;
  time: string;
  vehicleType: string;
  chargerType: string;
}): string | null {
  if (!fields.date) return 'Please select a date';
  if (!fields.time) return 'Please select a time slot';
  if (!fields.vehicleType) return 'Please select a vehicle type';
  if (!fields.chargerType) return 'Please select a charger type';
  return null; // all valid
}
