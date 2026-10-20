import test from 'node:test';
import assert from 'node:assert/strict';
import { chargerBookingBlocker } from '../server/services/booking-guard';

test('bookings require a charger that exists in GoEvee inventory and is in service', () => {
  assert.deepEqual(chargerBookingBlocker(undefined), { statusCode: 404, message: 'This charger is not available for booking on GoEvee.' });
  assert.equal(chargerBookingBlocker(null)?.statusCode, 404);
  assert.equal(chargerBookingBlocker({ status: 'OUT_OF_SERVICE' })?.statusCode, 409);
  assert.equal(chargerBookingBlocker({ status: 'MAINTENANCE' })?.statusCode, 409);
  assert.equal(chargerBookingBlocker({ status: 'AVAILABLE' }), null);
  assert.equal(chargerBookingBlocker({ status: 'OCCUPIED' }), null, 'overlap rules, not status, decide occupied chargers');
});
