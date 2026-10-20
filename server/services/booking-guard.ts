/**
 * Booking inventory guard. A reservation is accepted only for a charger that
 * exists in GoEvee's own inventory and is in service. Provider-discovered
 * stations (e.g. Google place IDs) have no verified mapping to inventory, so
 * they are never bookable — the client must not fabricate a reservation.
 */
export interface BookableCharger {
  status: string | null;
}

export interface BookingBlocker {
  statusCode: 404 | 409;
  message: string;
}

export function chargerBookingBlocker(charger: BookableCharger | null | undefined): BookingBlocker | null {
  if (!charger) return { statusCode: 404, message: 'This charger is not available for booking on GoEvee.' };
  if (charger.status === 'OUT_OF_SERVICE' || charger.status === 'MAINTENANCE') {
    return { statusCode: 409, message: 'Charger is not available for booking' };
  }
  return null;
}
