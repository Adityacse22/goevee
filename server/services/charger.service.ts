import type { AuthUser } from '../types/auth.js';
import { BOOKING_BUFFER_MINUTES } from '../config/index.js';
import { AppError } from '../middlewares/error.js';
import * as chargerRepository from '../repositories/charger.repository.js';
import * as bookingRepository from '../repositories/booking.repository.js';
import * as stationService from './station.service.js';
import type {
  CreateChargerInput,
  UpdateChargerStatusInput,
} from '../validators/charger.validator.js';

export async function createCharger(input: CreateChargerInput, user: AuthUser) {
  await stationService.assertCanManageStation(input.stationId, user);
  return chargerRepository.createCharger(input);
}

export async function getCharger(chargerId: string) {
  const charger = await chargerRepository.findChargerById(chargerId);
  if (!charger) throw new AppError(404, 'Charger not found');

  const latestBooking = await bookingRepository.findLatestBlockingBooking(chargerId);
  const estimatedAvailableAt = latestBooking
    ? new Date(latestBooking.endTime.getTime() + BOOKING_BUFFER_MINUTES * 60 * 1000)
    : charger.estimatedAvailableAt;

  return {
    ...charger,
    estimatedAvailableAt,
  };
}

export async function listChargersByStation(stationId: string) {
  return chargerRepository.listChargersByStation(stationId);
}

export async function updateChargerStatus(
  chargerId: string,
  input: UpdateChargerStatusInput,
  user: AuthUser,
) {
  const charger = await chargerRepository.findChargerById(chargerId);
  if (!charger) throw new AppError(404, 'Charger not found');

  await stationService.assertCanManageStation(charger.stationId, user);

  const updatedCharger = await chargerRepository.updateChargerStatus(chargerId, input);
  if (!updatedCharger) throw new AppError(404, 'Charger not found');
  return updatedCharger;
}
