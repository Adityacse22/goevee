/**
 * SERVICE — Station API layer.
 * Uses the README-defined Express REST API instead of direct database access.
 */

import { apiRequest } from '@/services/apiClient';
import type { EVStation, StationConnector, StationWithConnectors } from '@/models/station.model';

interface ApiCharger {
  id: string;
  stationId?: string;
  station_id?: string;
  chargerCode?: string;
  charger_code?: string;
  connectorType?: string;
  connector_type?: string;
  powerOutputKw?: string | number;
  power_output_kw?: string | number;
  status?: string;
  createdAt?: string;
  created_at?: string;
}

interface ApiStation {
  id: string;
  name: string;
  address: string;
  latitude: string | number;
  longitude: string | number;
  status?: string;
  pricingDetails?: Record<string, unknown> | null;
  pricing_details?: Record<string, unknown> | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  chargers?: ApiCharger[];
}

function numberFrom(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function priceFrom(station: ApiStation): number {
  const pricing = station.pricingDetails ?? station.pricing_details ?? {};
  return numberFrom(
    pricing.pricePerKwh ?? pricing.price_per_kwh ?? pricing.ratePerKwh,
    14,
  );
}

function mapCharger(charger: ApiCharger, stationId: string): StationConnector {
  const status = String(charger.status ?? 'AVAILABLE');

  return {
    id: charger.id,
    station_id: charger.stationId ?? charger.station_id ?? stationId,
    connector_type: charger.connectorType ?? charger.connector_type ?? 'Unknown',
    power_output: numberFrom(charger.powerOutputKw ?? charger.power_output_kw),
    available: status === 'AVAILABLE',
    created_at: charger.createdAt ?? charger.created_at ?? new Date().toISOString(),
  };
}

function mapStation(station: ApiStation): StationWithConnectors {
  return {
    id: station.id,
    name: station.name,
    address: station.address,
    latitude: numberFrom(station.latitude),
    longitude: numberFrom(station.longitude),
    price_per_kwh: priceFrom(station),
    available: station.status !== 'INACTIVE' && station.status !== 'SUSPENDED',
    rating: 0,
    total_reviews: 0,
    created_at: station.createdAt ?? station.created_at ?? new Date().toISOString(),
    updated_at: station.updatedAt ?? station.updated_at ?? new Date().toISOString(),
    connectors: (station.chargers ?? []).map((charger) => mapCharger(charger, station.id)),
  };
}

function mapStationToEVStation(station: ApiStation, distanceKm?: number): EVStation {
  const mapped = mapStation(station);

  return {
    id: mapped.id,
    name: mapped.name,
    location: {
      lat: mapped.latitude,
      lng: mapped.longitude,
    },
    rating: mapped.rating,
    total_reviews: mapped.total_reviews,
    address: mapped.address,
    price_per_kwh: mapped.price_per_kwh,
    available: mapped.available,
    connectors: mapped.connectors,
    distance: distanceKm == null ? undefined : distanceKm * 1000,
    isOpen: mapped.available,
  };
}

export async function fetchAllStations(): Promise<StationWithConnectors[]> {
  const response = await apiRequest<{ stations: ApiStation[] }>('/stations');
  return response.stations.map(mapStation);
}

export async function fetchStation(
  stationId: string,
): Promise<StationWithConnectors | null> {
  const response = await apiRequest<{ station: ApiStation }>(`/stations/${stationId}`);
  return mapStation(response.station);
}

export async function fetchNearbyStations(
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<EVStation[]> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radiusKm: String(radiusMeters / 1000),
  });
  const response = await apiRequest<{
    stations: Array<ApiStation | { station: ApiStation; distanceKm: string | number }>;
  }>(`/stations/nearby?${params.toString()}`);

  if (!response?.stations) return [];

  return response.stations.map((item) => {
    if (item && typeof item === 'object' && 'station' in item) {
      return mapStationToEVStation(item.station, numberFrom(item.distanceKm));
    }

    return mapStationToEVStation(item as ApiStation);
  });
}

export async function createStation(input: {
  name: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
}) {
  const response = await apiRequest<{ station: ApiStation }>('/stations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.station;
}

export async function createCharger(input: {
  stationId: string;
  chargerCode: string;
  connectorType: string;
  powerOutputKw: number;
  currentType?: string;
}) {
  const response = await apiRequest<{ charger: ApiCharger }>('/chargers', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.charger;
}
