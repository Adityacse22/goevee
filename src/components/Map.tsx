import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useSearch } from '@/controllers/useSearchController';
import { useGoogleMapsLoader } from '@/controllers/useGoogleMapsLoader';
import { searchNearbyEVStations } from '@/services/googleMapsService';
import { type EVStation, type Location as MapLocation } from '@/models/station.model';
import { formatDistance } from '@/utils/formatting';
import { DEFAULT_CENTER, DEFAULT_RADIUS, RADIUS_OPTIONS } from '@/config/constants';
import PlacesAutocompleteInput from './PlacesAutocompleteInput';

interface MapComponentProps {
  onStationsUpdate?: (stations: EVStation[]) => void;
  onSearchingChange?: (isSearching: boolean) => void;
  onHighlightedStationChange?: (id: string | null) => void;
  onBookStation?: (station: EVStation) => void;
  showControls?: boolean;
}

const MapComponent = ({
  onStationsUpdate,
  onSearchingChange,
  onHighlightedStationChange,
  onBookStation,
  showControls = true,
}: MapComponentProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const markersRef = useRef<GoogleMarker[]>([]);
  const infoWindowRef = useRef<GoogleInfoWindow | null>(null);
  const locationMarkerRef = useRef<GoogleMarker | null>(null);
  const stationsRef = useRef<EVStation[]>([]);
  const latestCoordsRef = useRef<MapLocation | null>(null);
  const [stations, setStations] = useState<EVStation[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [searchRadius, setSearchRadius] = useState(DEFAULT_RADIUS);
  const [panelQuery, setPanelQuery] = useState('');
  const mapId = useId().replace(/:/g, '-');
  const sdkStatus = useGoogleMapsLoader();

  const {
    triggerSearch,
    resolvedCoords,
    resolvedViewport,
    resolvedName,
    resolvedRequestId,
    isSearching,
    searchError,
    requestCurrentLocation,
    locationRequestId,
    locationStatus,
    setLocationStatus,
  } = useSearch();

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  }, []);

  const renderStations = useCallback((results: EVStation[]) => {
    if (!mapRef.current || !window.google?.maps) return;

    clearMarkers();
    const bounds = new window.google.maps.LatLngBounds();

    results.forEach((station) => {
      const distanceText = formatDistance(station.distance);
      const marker = new window.google.maps.Marker({
        map: mapRef.current,
        position: station.location,
        title: station.name,
      });

      marker.addListener('click', () => {
        onHighlightedStationChange?.(station.id);
        infoWindowRef.current = new window.google.maps.InfoWindow({
          content: `
            <div style="padding:12px;min-width:210px;font-family:sans-serif">
              <strong style="font-size:13px;color:#0f766e">${station.name}</strong>
              <p style="font-size:11px;color:#4b5563;margin:6px 0 2px">${station.address}</p>
              <p style="font-size:11px;margin:0 0 8px">${distanceText} away</p>
              <button
                onclick="window.__eveeBook && window.__eveeBook('${station.id}')"
                style="background:#00c9a7;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-weight:bold;font-size:12px"
              >
                Book Now
              </button>
            </div>
          `,
        });
        infoWindowRef.current.open({ map: mapRef.current!, anchor: marker });
      });

      bounds.extend(station.location);
      markersRef.current.push(marker);
    });

    if (results.length > 1) {
      mapRef.current.fitBounds(bounds);
    }
  }, [clearMarkers, onHighlightedStationChange]);

  const loadEVChargers = useCallback(async (lat: number, lng: number) => {
    if (!mapRef.current) return;

    setIsFetching(true);
    onSearchingChange?.(true);
    setStations([]);
    clearMarkers();

    try {
      const nearbyStations = await searchNearbyEVStations(
        lat,
        lng,
        searchRadius,
      );
      setStations(nearbyStations);
      stationsRef.current = nearbyStations;
      onStationsUpdate?.(nearbyStations);
      renderStations(nearbyStations);

      if (nearbyStations.length === 0) {
        toast.error('No EV charging stations found nearby. Try a larger radius.');
      }
    } catch (error) {
      console.error('Nearby station lookup failed:', error);
      toast.error('Could not load nearby EV stations. Check your connection.');
    } finally {
      setIsFetching(false);
      onSearchingChange?.(false);
    }
  }, [clearMarkers, onSearchingChange, onStationsUpdate, renderStations, searchRadius]);

  useEffect(() => {
    if (sdkStatus !== 'ready' || mapRef.current || !mapContainerRef.current || !window.google?.maps) {
      return;
    }

    mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 12,
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: false,
    });
  }, [sdkStatus]);

  useEffect(() => {
    return () => {
      clearMarkers();
      locationMarkerRef.current?.setMap(null);
      mapRef.current = null;
    };
  }, [clearMarkers]);

  useEffect(() => {
    if (!resolvedCoords || !mapRef.current || sdkStatus !== 'ready' || !window.google?.maps) {
      return;
    }

    latestCoordsRef.current = resolvedCoords;
    
    if (resolvedViewport) {
      mapRef.current.fitBounds(resolvedViewport);
    } else {
      mapRef.current.setCenter(resolvedCoords);
      mapRef.current.setZoom(13);
    }

    locationMarkerRef.current?.setMap(null);
    locationMarkerRef.current = new window.google.maps.Marker({
      map: mapRef.current,
      position: resolvedCoords,
      title: resolvedName || 'Selected Location',
    });

    void loadEVChargers(resolvedCoords.lat, resolvedCoords.lng);
  }, [loadEVChargers, resolvedCoords, resolvedName, resolvedRequestId, sdkStatus]);

  useEffect(() => {
    if (!locationRequestId) return;

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        latestCoordsRef.current = coords;
        setLocationStatus('active');

        if (mapRef.current && window.google?.maps) {
          mapRef.current.setCenter(coords);
          mapRef.current.setZoom(13);
          locationMarkerRef.current?.setMap(null);
          locationMarkerRef.current = new window.google.maps.Marker({
            map: mapRef.current,
            position: coords,
            title: 'Current Location',
          });
        }

        void loadEVChargers(coords.lat, coords.lng);
      },
      (err: GeolocationPositionError) => {
        setLocationStatus('idle');
        const GEO_ERRORS: Record<number, string> = {
          1: 'Location access denied. Please allow location in your browser settings.',
          2: 'Your position is unavailable. Check device GPS or Wi-Fi.',
          3: 'Location request timed out. Please try again.',
        };
        toast.error(GEO_ERRORS[err.code] ?? 'Could not access your location.');
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, [loadEVChargers, locationRequestId, setLocationStatus]);

  useEffect(() => {
    window.__eveeBook = (id: string) => {
      const station = stationsRef.current.find((item) => item.id === id);
      if (station) onBookStation?.(station);
    };

    return () => {
      delete window.__eveeBook;
    };
  }, [onBookStation]);

  const handleInlineSearch = (query = panelQuery) => {
    if (!query.trim()) return;
    void triggerSearch(query);
  };

  return (
    <div className="relative h-full w-full">
      {showControls && (
        <div className="absolute right-4 top-4 z-10 flex w-full max-w-[200px] flex-col gap-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-3 shadow-lg backdrop-blur-xl">
            <label className="block text-sm font-medium text-white/80">
              Search Radius ({searchRadius / 1000}km)
            </label>
            <select
              value={searchRadius}
              onChange={(event) => {
                const nextRadius = Number(event.target.value);
                setSearchRadius(nextRadius);
                if (latestCoordsRef.current) {
                  void loadEVChargers(latestCoordsRef.current.lat, latestCoordsRef.current.lng);
                }
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              {RADIUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={requestCurrentLocation}
            disabled={locationStatus === 'loading' || sdkStatus !== 'ready'}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-xl transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {locationStatus === 'loading' ? 'Detecting...' : 'Find My Location'}
          </button>
        </div>
      )}

      {(isFetching || isSearching) && sdkStatus === 'ready' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {sdkStatus === 'error' && (
        <div className="flex h-full min-h-[600px] items-center justify-center text-[#00c9a7]">
          <p>Map failed to load. Check VITE_GOOGLE_MAPS_API_KEY.</p>
        </div>
      )}

      {sdkStatus === 'loading' && (
        <div className="flex h-full min-h-[600px] items-center justify-center text-slate-400">
          <p>Loading map...</p>
        </div>
      )}

      <div
        id={mapId}
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '600px',
          display: sdkStatus === 'ready' ? 'block' : 'none',
        }}
      />
    </div>
  );
};

export default MapComponent;
