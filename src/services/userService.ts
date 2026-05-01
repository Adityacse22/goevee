import { apiRequest } from '@/services/apiClient';
import type { Profile } from '@/models/auth.model';

export interface FavoriteStation {
  id: string;
  createdAt: string;
  station: {
    id: string;
    name: string;
    address: string;
    status: string;
  };
}

export async function getProfile(): Promise<Profile> {
  const response = await apiRequest<{ profile: Profile }>('/users/profile');
  return response.profile;
}

export async function updateProfile(input: {
  fullName?: string;
  phone?: string;
}): Promise<Profile> {
  const response = await apiRequest<{ profile: Profile }>('/users/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return response.profile;
}

export async function createVehicle(input: {
  vehicleName: string;
  brand?: string;
  model?: string;
  connectorType?: string;
  batteryCapacity?: number;
}) {
  const response = await apiRequest<{ vehicle: unknown }>('/users/vehicles', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.vehicle;
}

export async function getFavorites(): Promise<FavoriteStation[]> {
  const response = await apiRequest<{ favorites: FavoriteStation[] }>('/users/favorites');
  return response.favorites;
}
