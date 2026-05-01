import { AppError } from '../middlewares/error.js';
import * as userRepository from '../repositories/user.repository.js';
import type {
  CreateVehicleInput,
  UpdateProfileInput,
} from '../validators/user.validator.js';

export async function getProfile(userId: string) {
  const user = await userRepository.findUserById(userId);
  if (!user) throw new AppError(404, 'User not found');

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    phone: user.phone,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await userRepository.updateUserProfile(userId, input);
  if (!user) throw new AppError(404, 'User not found');
  return getProfile(user.id);
}

export async function createVehicle(userId: string, input: CreateVehicleInput) {
  return userRepository.createVehicle(userId, input);
}

export async function listBookings(userId: string) {
  return userRepository.listUserBookings(userId);
}

export async function listFavorites(userId: string) {
  return userRepository.listUserFavorites(userId);
}
