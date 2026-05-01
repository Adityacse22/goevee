/**
 * CONTROLLER — Station data hook.
 * Wraps stationService queries with React Query caching.
 * Moved from hooks/useStations.ts.
 */

import { useQuery } from '@tanstack/react-query';
import * as stationService from '@/services/stationService';
import type { StationWithConnectors } from '@/models/station.model';

export const useStations = () => {
  return useQuery({
    queryKey: ['stations'],
    queryFn: (): Promise<StationWithConnectors[]> => stationService.fetchAllStations(),
  });
};

export const useStation = (stationId: string) => {
  return useQuery({
    queryKey: ['station', stationId],
    queryFn: (): Promise<StationWithConnectors | null> =>
      stationService.fetchStation(stationId),
    enabled: !!stationId,
  });
};
