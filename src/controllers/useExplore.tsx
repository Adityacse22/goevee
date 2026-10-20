/**
 * CONTROLLER — Explore state shared by the shell pages.
 *
 * Location model (kept deliberately separate):
 *   - deviceLocation: the browser's actual fix (coords, accuracy, timestamp). Memory only.
 *   - searchCenter:   what the results are about — the device fix or a place the user chose.
 * A late GPS callback never overwrites a place the user picked after asking for GPS.
 *
 * Results come from /api/v1/discovery keyed on (centre, radius); React Query
 * keeps responses per key, so an older search can never replace a newer one.
 * Filters, sort and radius live in the URL; the garage choice in localStorage;
 * a chosen place (not the device position) in sessionStorage.
 */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { applyFilters, chipConnectorFor, FAST_MIN_KW, NO_FILTERS, sortStations } from '@/lib/filters';
import { fetchVehicles } from '@/lib/explore-service';
import { DEFAULT_VEHICLE_ID } from '@/lib/mock-data';
import { parseFilters, parseSort, writeFilters, filterQuery as toFilterQuery } from '@/lib/url-state';
import { t } from '@/lib/messages';
import { adaptDiscoveryStation } from '@/lib/discovery/adapter';
import { DiscoveryRequestError, reverseGeocode, searchStations, type DiscoveryFailure } from '@/lib/discovery/client';
import { geolocationPermission, getDeviceLocation, LocationError, type DeviceLocation, type LocationErrorKind } from '@/lib/discovery/geolocation';
import { DEFAULT_RADIUS_KM, isValidLatLng, parseRadiusKm, type LatLng, type RadiusKm, type SearchCoverage } from '../../shared/discovery';
import type { ConnectorType, Filters, LiveConnectionState, Origin, SortKey, Station, Vehicle } from '@/lib/types';

const VEHICLE_KEY = 'goevee.vehicle';
const CENTER_KEY = 'goevee.search-center.v1';
const VEHICLES_QUERY = ['explore', 'vehicles'] as const;

export type QuickFilter = 'available' | 'connector' | 'fast';
/** 'idle' = no location chosen yet. */
export type LoadStatus = 'idle' | 'locating' | 'loading' | 'ready' | 'error';
export type LocateState = 'idle' | 'locating' | LocationErrorKind;

export interface SearchCenter {
  source: 'device' | 'place';
  /** Display label. For the device: a reverse-geocoded area, or null while unknown. */
  label: string | null;
  secondaryLabel?: string | null;
  placeId?: string | null;
  coords: LatLng;
}

export interface SearchMeta {
  radiusKm: RadiusKm;
  count: number;
  limit: number;
  partial: boolean;
  empty: boolean;
  coverage: SearchCoverage | null;
  retrievedAt: string | null;
  errorKind: DiscoveryFailure | null;
}

interface ExploreContextValue {
  now: number;
  vehicles: Vehicle[];
  vehiclesStatus: 'loading' | 'ready' | 'error';
  vehicle: Vehicle | null;
  selectVehicle: (id: string) => void;
  chipConnector: ConnectorType | null;
  filters: Filters;
  toggleFilter: (filter: QuickFilter) => void;
  clearFilters: () => void;
  sort: SortKey;
  setSort: (sort: SortKey) => void;
  radiusKm: RadiusKm;
  setRadiusKm: (radius: RadiusKm) => void;
  deviceLocation: DeviceLocation | null;
  locateState: LocateState;
  requestDeviceLocation: () => void;
  dismissLocateMessage: () => void;
  searchCenter: SearchCenter | null;
  chooseSearchCenter: (center: SearchCenter) => void;
  /** Human label for the current centre ("Connaught Place", "your current location"). */
  centerLabel: string | null;
  /** Legacy origin shape for the preview/map deep link; null until a centre exists. */
  origin: Origin | null;
  stations: Station[];
  results: Station[];
  status: LoadStatus;
  search: SearchMeta;
  isOffline: boolean;
  snapshotTime: number | null;
  refreshFailed: boolean;
  retry: () => void;
  live: LiveConnectionState;
  highlightedId: string | null;
  setHighlightedId: (id: string | null) => void;
  announcement: string;
  announce: (message: string) => void;
  filterQuery: string;
  onFirstSeen: () => void;
}

const ExploreContext = createContext<ExploreContextValue | null>(null);

function readStorage(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: () => Storage, key: string, value: string | null) {
  try {
    if (value == null) storage().removeItem(key);
    else storage().setItem(key, value);
  } catch {
    // Preferences still apply for this visit.
  }
}

/** Only a place the user chose is restored; the device position is never persisted. */
function readSavedCenter(): SearchCenter | null {
  try {
    const parsed = JSON.parse(readStorage(() => sessionStorage, CENTER_KEY) ?? 'null') as SearchCenter | null;
    if (parsed && parsed.source === 'place' && typeof parsed.label === 'string' && isValidLatLng(parsed.coords)) {
      return { source: 'place', label: parsed.label, secondaryLabel: parsed.secondaryLabel ?? null, placeId: parsed.placeId ?? null, coords: parsed.coords };
    }
  } catch {
    // Start without a centre.
  }
  return null;
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    const onVisible = () => { if (document.visibilityState === 'visible') setNow(Date.now()); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs]);
  return now;
}

function useOnline() {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

/** Appends the radius to a filter query string (default radius stays implicit). */
function withRadius(query: string, radiusKm: RadiusKm): string {
  if (radiusKm === DEFAULT_RADIUS_KM) return query;
  const params = new URLSearchParams(query);
  params.set('radius', String(radiusKm));
  return `?${params.toString()}`;
}

const centerKey = (center: SearchCenter | null) => (center ? `${center.coords.lat.toFixed(6)},${center.coords.lng.toFixed(6)}` : 'none');

export function ExploreProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useSearchParams();
  const now = useNow(15_000);
  const online = useOnline();

  // ---- Garage ----
  const vehiclesQuery = useQuery({ queryKey: VEHICLES_QUERY, queryFn: ({ signal }) => fetchVehicles(signal), staleTime: Infinity });
  const vehicles = useMemo(() => vehiclesQuery.data ?? [], [vehiclesQuery.data]);
  const [vehicleId, setVehicleId] = useState(() => readStorage(() => localStorage, VEHICLE_KEY) ?? DEFAULT_VEHICLE_ID);
  const vehicle = vehicles.find(item => item.id === vehicleId) ?? vehicles[0] ?? null;
  const vehicleChip = chipConnectorFor(vehicle);

  // ---- Filters, sort, radius (URL) ----
  const filters = useMemo(() => parseFilters(params), [params]);
  const sort = useMemo(() => parseSort(params), [params]);
  const radiusKm: RadiusKm = parseRadiusKm(params.get('radius')) ?? DEFAULT_RADIUS_KM;
  const chipConnector = filters.connector ?? vehicleChip;

  const commit = useCallback((nextFilters: Filters, nextSort: SortKey) => {
    setParams(current => writeFilters(current, nextFilters, nextSort), { replace: true });
  }, [setParams]);

  const toggleFilter = useCallback((filter: QuickFilter) => {
    const next: Filters = { ...filters };
    if (filter === 'available') next.available = !filters.available;
    if (filter === 'connector') next.connector = filters.connector ? null : chipConnector;
    if (filter === 'fast') next.minKw = filters.minKw != null ? null : FAST_MIN_KW;
    commit(next, sort);
  }, [chipConnector, commit, filters, sort]);

  const clearFilters = useCallback(() => commit(NO_FILTERS, sort), [commit, sort]);
  const setSort = useCallback((nextSort: SortKey) => commit(filters, nextSort), [commit, filters]);
  const setRadiusKm = useCallback((radius: RadiusKm) => {
    setParams(current => {
      const next = new URLSearchParams(current);
      if (radius === DEFAULT_RADIUS_KM) next.delete('radius');
      else next.set('radius', String(radius));
      return next;
    }, { replace: true });
  }, [setParams]);

  const selectVehicle = useCallback((id: string) => {
    setVehicleId(id);
    writeStorage(() => localStorage, VEHICLE_KEY, id);
    const nextVehicle = vehicles.find(item => item.id === id);
    if (filters.connector && nextVehicle) commit({ ...filters, connector: chipConnectorFor(nextVehicle) }, sort);
  }, [commit, filters, sort, vehicles]);

  // ---- Announcements ----
  const [announcement, setAnnouncement] = useState('');
  const announce = useCallback((message: string) => {
    setAnnouncement('');
    window.setTimeout(() => setAnnouncement(message), 60);
  }, []);

  // ---- Location ----
  const [searchCenter, setSearchCenter] = useState<SearchCenter | null>(readSavedCenter);
  const [deviceLocation, setDeviceLocation] = useState<DeviceLocation | null>(null);
  const [locateState, setLocateState] = useState<LocateState>('idle');
  /** Bumped on every manual place choice; a GPS result only becomes the centre if this is unchanged. */
  const choiceEpoch = useRef(0);
  const locateInFlight = useRef(false);

  const chooseSearchCenter = useCallback((center: SearchCenter) => {
    choiceEpoch.current += 1;
    setSearchCenter(center);
    writeStorage(() => sessionStorage, CENTER_KEY, center.source === 'place' ? JSON.stringify(center) : null);
    if (center.source === 'place') setLocateState(state => (state === 'locating' ? 'idle' : state));
  }, []);

  const locate = useCallback((silent: boolean) => {
    if (locateInFlight.current) return;
    locateInFlight.current = true;
    const epoch = choiceEpoch.current;
    if (!silent) setLocateState('locating');
    if (!silent) announce(t.discovery.findingLocation);
    getDeviceLocation()
      .then(fix => {
        setDeviceLocation(fix);
        setLocateState('idle');
        if (choiceEpoch.current !== epoch) return; // user picked a place meanwhile — keep it
        choiceEpoch.current += 1;
        const center: SearchCenter = { source: 'device', label: null, coords: fix.coords };
        setSearchCenter(center);
        writeStorage(() => sessionStorage, CENTER_KEY, null);
        const labelEpoch = choiceEpoch.current;
        // Label is cosmetic: discovery never waits for it.
        reverseGeocode(fix.coords)
          .then(result => {
            if (result.label && choiceEpoch.current === labelEpoch) setSearchCenter(current => (current && current.source === 'device' ? { ...current, label: result.label } : current));
          })
          .catch(() => undefined);
      })
      .catch((error: unknown) => {
        if (!silent) setLocateState(error instanceof LocationError ? error.kind : 'unavailable');
      })
      .finally(() => { locateInFlight.current = false; });
  }, [announce]);

  const requestDeviceLocation = useCallback(() => locate(false), [locate]);
  const dismissLocateMessage = useCallback(() => setLocateState('idle'), []);

  // Permission already granted (and no saved choice): use it without prompting.
  useEffect(() => {
    if (searchCenter) return;
    let cancelled = false;
    void geolocationPermission().then(state => { if (!cancelled && state === 'granted') locate(true); });
    return () => { cancelled = true; };
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Stations ----
  const key = centerKey(searchCenter);
  const stationsQuery = useQuery({
    queryKey: ['discovery', 'stations', key, radiusKm],
    queryFn: ({ signal }) => searchStations(searchCenter!.coords, radiusKm, signal),
    enabled: Boolean(searchCenter),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: (count, error) => count < 1 && error instanceof DiscoveryRequestError && (error.code === 'NETWORK' || error.code === 'PROVIDER_UNAVAILABLE'),
  });
  const response = stationsQuery.data;
  // Results always describe the centre they were fetched for (same query key).
  const stations = useMemo(() => (response ? response.stations.map(adaptDiscoveryStation) : []), [response]);
  const results = useMemo(() => sortStations(applyFilters(stations, filters, now), sort), [filters, now, sort, stations]);
  const errorKind: DiscoveryFailure | null = stationsQuery.isError
    ? stationsQuery.error instanceof DiscoveryRequestError ? stationsQuery.error.code : 'NETWORK'
    : null;

  const status: LoadStatus = !searchCenter
    ? locateState === 'locating' ? 'locating' : 'idle'
    : response ? 'ready' : stationsQuery.isError ? 'error' : 'loading';

  const centerLabel = searchCenter
    ? searchCenter.source === 'place' ? searchCenter.label : searchCenter.label ?? t.discovery.yourCurrentLocation
    : null;

  // Announce completed searches (count + radius + place), never background noise.
  const lastAnnounced = useRef<string | null>(null);
  useEffect(() => {
    if (!response) return;
    const signature = `${key}|${radiusKm}|${response.retrievedAt}`;
    if (lastAnnounced.current === signature) return;
    lastAnnounced.current = signature;
    announce(t.discovery.resultsAnnouncement(response.count, radiusKm, centerLabel ?? ''));
  }, [announce, centerLabel, key, radiusKm, response]);

  const isOffline = !online;
  const retry = useCallback(() => { void stationsQuery.refetch(); }, [stationsQuery]);
  useEffect(() => {
    if (online && stationsQuery.isError) void stationsQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  const snapshotTime = isOffline && response ? Date.parse(response.retrievedAt) : null;
  const refreshFailed = false;

  const search: SearchMeta = useMemo(() => ({
    radiusKm,
    count: response?.count ?? 0,
    limit: response?.limit ?? 20,
    partial: response?.status === 'partial',
    empty: response?.status === 'empty',
    coverage: response?.coverage ?? null,
    retrievedAt: response?.retrievedAt ?? null,
    errorKind,
  }), [errorKind, radiusKm, response]);

  const origin: Origin | null = useMemo(() => (searchCenter
    ? { kind: searchCenter.source === 'device' ? 'current' : 'place', label: centerLabel ?? '', coords: searchCenter.coords }
    : null), [centerLabel, searchCenter]);

  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const onFirstSeen = useCallback(() => undefined, []);
  // Discovery data has no live feed; the indicator reflects connectivity only.
  const live: LiveConnectionState = isOffline ? 'paused' : 'live';

  const value = useMemo<ExploreContextValue>(() => ({
    now,
    vehicles,
    vehiclesStatus: vehiclesQuery.isError ? 'error' : vehiclesQuery.data ? 'ready' : 'loading',
    vehicle,
    selectVehicle,
    chipConnector,
    filters,
    toggleFilter,
    clearFilters,
    sort,
    setSort,
    radiusKm,
    setRadiusKm,
    deviceLocation,
    locateState,
    requestDeviceLocation,
    dismissLocateMessage,
    searchCenter,
    chooseSearchCenter,
    centerLabel,
    origin,
    stations,
    results,
    status,
    search,
    isOffline,
    snapshotTime,
    refreshFailed,
    retry,
    live,
    highlightedId,
    setHighlightedId,
    announcement,
    announce,
    filterQuery: withRadius(toFilterQuery(filters, sort), radiusKm),
    onFirstSeen,
  }), [
    announce, announcement, centerLabel, chipConnector, chooseSearchCenter, clearFilters, deviceLocation,
    dismissLocateMessage, filters, highlightedId, isOffline, live, locateState, now, onFirstSeen, origin,
    radiusKm, refreshFailed, requestDeviceLocation, results, retry, search, searchCenter, selectVehicle, setRadiusKm, setSort,
    snapshotTime, sort, status, stations, toggleFilter, vehicle, vehicles, vehiclesQuery.data, vehiclesQuery.isError,
  ]);

  return <ExploreContext.Provider value={value}>{children}</ExploreContext.Provider>;
}

export function useExplore(): ExploreContextValue {
  const context = useContext(ExploreContext);
  if (!context) throw new Error('useExplore must be used inside ExploreProvider');
  return context;
}
