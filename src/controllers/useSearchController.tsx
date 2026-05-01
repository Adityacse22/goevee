/**
 * CONTROLLER — Search context provider + hook.
 * Manages search state and coordinates the Google Maps geo-search flow.
 *
 * Refactored from context/SearchContext.tsx:
 *   - Types imported from models/search.model.ts
 *   - API calls delegated to services/googleMapsService.ts
 */

/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  geocodeAddress,
  searchLocation,
} from '@/services/googleMapsService';
import type { Coords, LocationStatus, SearchResult } from '@/models/search.model';

interface SearchContextType {
  triggerSearch: (query: string) => Promise<void>;
  resolveSelectedLocation: (result: SearchResult) => void;
  clearSearchError: () => void;
  resolvedCoords: Coords | null;
  resolvedViewport: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral | null;
  resolvedName: string;
  resolvedPin: string;
  resolvedRequestId: number;
  isSearching: boolean;
  searchError: string;
  requestCurrentLocation: () => void;
  locationRequestId: number;
  locationStatus: LocationStatus;
  setLocationStatus: (status: LocationStatus) => void;
}

const Ctx = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [resolvedCoords, setResolvedCoords] = useState<Coords | null>(null);
  const [resolvedViewport, setResolvedViewport] = useState<google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral | null>(null);
  const [resolvedName, setResolvedName] = useState('');
  const [resolvedPin, setResolvedPin] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [locationRequestId, setLocationRequestId] = useState(0);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [resolvedRequestId, setResolvedRequestId] = useState(0);

  const resolveSelectedLocation = useCallback((result: SearchResult) => {
    const coords =
      result.lat != null && result.lng != null
        ? { lat: result.lat, lng: result.lng }
        : null;

    setResolvedCoords(coords);
    setResolvedViewport(result.viewport || null);
    setResolvedName(result.name || result.address || 'Selected Location');
    setResolvedPin(result.eLoc);
    setSearchError('');
    setResolvedRequestId((prev) => prev + 1);

    console.log('[resolveSelectedLocation] state updated', {
      resolvedCoords: coords,
      resolvedViewport: result.viewport,
      resolvedName: result.name,
      resolvedPin: result.eLoc,
    });
  }, []);

  const clearSearchError = useCallback(() => {
    setSearchError('');
  }, []);

  const triggerSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        console.warn('[triggerSearch] ignored empty query');
        return;
      }

      console.log('[triggerSearch] start', { query });
      setIsSearching(true);
      setSearchError('');

      try {
        let result = await searchLocation(query);
        console.log('[triggerSearch] result', result);

        if (!result) {
          console.log('[triggerSearch] autosuggest empty, trying geocode fallback', {
            query,
          });
          const coords = await geocodeAddress(query);
          if (coords) result = coords;
        }

        if (result) {
          resolveSelectedLocation(result);
        } else {
          console.warn('[triggerSearch] no result found', { query });
          setSearchError(
            `Location "${query}" not found. Try a more specific name like "New Delhi", "Mumbai", or "Samalkha Haryana".`,
          );
        }
      } catch (error) {
        console.error('[triggerSearch] failed', error);
        setSearchError(
          'Search failed. Check that Google Maps is configured and loaded.',
        );
      } finally {
        setIsSearching(false);
        console.log('[triggerSearch] complete', { query });
      }
    },
    [resolveSelectedLocation],
  );

  const value = useMemo<SearchContextType>(
    () => ({
      triggerSearch,
      resolveSelectedLocation,
      clearSearchError,
      resolvedCoords,
      resolvedViewport,
      resolvedName,
      resolvedPin,
      isSearching,
      searchError,
      requestCurrentLocation: () => {
        setLocationRequestId((prev) => prev + 1);
      },
      locationRequestId,
      resolvedRequestId,
      locationStatus,
      setLocationStatus,
    }),
    [
      clearSearchError,
      isSearching,
      locationRequestId,
      locationStatus,
      resolveSelectedLocation,
      resolvedCoords,
      resolvedViewport,
      resolvedName,
      resolvedPin,
      resolvedRequestId,
      searchError,
      triggerSearch,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSearch = () => {
  const context = useContext(Ctx);
  if (!context) {
    throw new Error('Must be inside SearchProvider');
  }
  return context;
};
