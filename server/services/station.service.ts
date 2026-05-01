import type { AuthUser } from '../types/auth.js';
import { AppError } from '../middlewares/error.js';
import * as stationRepository from '../repositories/station.repository.js';
import type {
  CreateStationInput,
  UpdateStationInput,
} from '../validators/station.validator.js';

function canManageStation(user: AuthUser, station: { operatorId: string | null }): boolean {
  return user.role === 'ADMIN' || (user.role === 'OPERATOR' && station.operatorId === user.userId);
}

export async function createStation(input: CreateStationInput, user: AuthUser) {
  const operatorId = user.role === 'ADMIN' ? input.operatorId : user.userId;
  return stationRepository.createStation(input, operatorId);
}

export async function listStations() {
  return stationRepository.listStations();
}

export async function listNearbyStations(lat: number, lng: number, radiusKm: number) {
  return stationRepository.listNearbyStations(lat, lng, radiusKm);
}

export async function getStation(stationId: string) {
  const station = await stationRepository.findStationWithChargers(stationId);
  if (!station) throw new AppError(404, 'Station not found');
  return station;
}

export async function updateStation(
  stationId: string,
  input: UpdateStationInput,
  user: AuthUser,
) {
  const existingStation = await stationRepository.findStationById(stationId);
  if (!existingStation) throw new AppError(404, 'Station not found');
  if (!canManageStation(user, existingStation)) {
    throw new AppError(403, 'You can only manage your own stations');
  }

  const updatedStation = await stationRepository.updateStation(stationId, input);
  if (!updatedStation) throw new AppError(404, 'Station not found');
  return updatedStation;
}

export async function assertCanManageStation(stationId: string, user: AuthUser) {
  const station = await stationRepository.findStationById(stationId);
  if (!station) throw new AppError(404, 'Station not found');
  if (!canManageStation(user, station)) {
    throw new AppError(403, 'You can only manage chargers for your own stations');
  }
  return station;
}
