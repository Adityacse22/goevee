import {
  mapSuggestion,
  pickBestLocation,
  type SearchResult,
  type SearchSuggestion,
} from '@/models/search.model';
import type { EVStation, StationConnector } from '@/models/station.model';
import { calculateDistance } from '@/utils/geo';

/**
 * Fields requested from Places API (New). Google bills the request at the
 * highest SKU among the requested fields:
 *   - id, displayName, location, formattedAddress, businessStatus → Nearby Search Pro
 *   - rating, userRatingCount                                      → Nearby Search Enterprise
 *   - evChargeOptions (connector types, kW, live availability)     → Enterprise + Atmosphere
 * Remove fields from this list to lower the cost per search.
 */
const EV_STATION_FIELDS = [
  'id',
  'displayName',
  'location',
  'formattedAddress',
  'businessStatus',
  'rating',
  'userRatingCount',
  'evChargeOptions',
];

/** Nearby Search (New) limits: radius ≤ 50 km, at most 20 results. */
const MAX_SEARCH_RADIUS_METERS = 50_000;
const MAX_RESULTS = 20;
const SEARCH_TIMEOUT_MS = 15_000;

/** Google does not publish tariffs, so the UI keeps showing this placeholder price. */
const DEFAULT_PRICE_PER_KWH = 15;

const CONNECTOR_LABELS: Record<string, string> = {
  CCS_COMBO_2: 'CCS2',
  CCS_COMBO_1: 'CCS1',
  TYPE_2: 'Type 2',
  CHADEMO: 'CHAdeMO',
  UNSPECIFIED_GB_T: 'GB/T',
  J1772: 'Type 1 (J1772)',
  TESLA: 'Tesla',
  NACS: 'NACS',
  UNSPECIFIED_WALL_OUTLET: 'Wall outlet',
  OTHER: 'Other',
};

function googleUnavailable(): boolean {
  return !window.google?.maps;
}

export async function geocodeAddress(address: string): Promise<SearchResult | null> {
  if (!address.trim() || googleUnavailable()) return null;

  const geocoder = new window.google.maps.Geocoder();
  const response = await geocoder.geocode({ address: address.trim() });
  const result = response.results[0];
  if (!result) return null;

  return {
    lat: result.geometry.location.lat(),
    lng: result.geometry.location.lng(),
    name: result.formatted_address,
    address: result.formatted_address,
    eLoc: result.place_id ?? '',
    viewport: result.geometry.viewport?.toJSON(),
  };
}

export async function searchLocationSuggestions(
  query: string,
): Promise<SearchSuggestion[]> {
  if (!query.trim() || googleUnavailable()) return [];

  const service = new window.google.maps.places.AutocompleteService();

  return new Promise((resolve) => {
    service.getPlacePredictions({ input: query.trim() }, (predictions, status) => {
      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
        resolve([]);
        return;
      }

      resolve(predictions.slice(0, 6).map((prediction, index) => mapSuggestion({
        placeName: prediction.structured_formatting?.main_text ?? prediction.description,
        placeAddress: prediction.structured_formatting?.secondary_text ?? prediction.description,
        eLoc: prediction.place_id,
        type: prediction.types?.[0],
      }, query.trim(), index)));
    });
  });
}

export async function searchLocation(query: string): Promise<SearchResult | null> {
  const suggestions = await searchLocationSuggestions(query);
  const suggestion = pickBestLocation(suggestions);

  if (suggestion?.lat != null && suggestion.lng != null) {
    return suggestion;
  }

  return geocodeAddress(suggestion?.address || suggestion?.name || query);
}

function connectorLabel(type?: string | null): string {
  if (!type) return 'Unknown';
  return CONNECTOR_LABELS[type] ?? type.replace(/_/g, ' ');
}

/** Maps Google's evChargeOptions into the app's connector shape (one entry per type + kW group). */
function toConnectors(place: GooglePlace, createdAt: string): StationConnector[] {
  const aggregations = place.evChargeOptions?.connectorAggregations ?? [];

  return aggregations.map((aggregation, index) => ({
    id: `${place.id}-c${index + 1}`,
    station_id: place.id,
    connector_type: connectorLabel(aggregation.type),
    power_output: aggregation.maxChargeRateKw ?? 0,
    // Google reports live availability only for some networks; unknown is treated as available.
    available: aggregation.availableCount == null ? true : aggregation.availableCount > 0,
    created_at: createdAt,
  }));
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** Turns Google's error into a message the UI can show. */
function describePlacesError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);

  if (/PERMISSION_DENIED|BillingNotEnabled/i.test(message)) {
    return new Error(
      'Google rejected the charger search. Enable billing and "Places API (New)" on the API key\'s Google Cloud project, and allow that API in the key\'s restrictions.',
    );
  }

  return new Error(`Charger search failed: ${message}`);
}

/**
 * Finds EV charging stations near a point using Places API (New): Place.searchNearby.
 * The legacy PlacesService.nearbySearch is not available to Google Cloud projects
 * created after 1 March 2025, so it must not be used here.
 *
 * Throws when Google rejects the request so the UI can show the reason
 * instead of silently rendering an empty list.
 */
export async function searchNearbyEVStations(
  lat: number,
  lng: number,
  radiusMeters = 5000,
): Promise<EVStation[]> {
  if (googleUnavailable()) {
    throw new Error('Google Maps has not finished loading. Please try again.');
  }

  let places: GooglePlace[];
  try {
    const { Place, SearchNearbyRankPreference } = await window.google.maps.importLibrary('places');
    const response = await withTimeout(
      Place.searchNearby({
        fields: EV_STATION_FIELDS,
        locationRestriction: {
          center: { lat, lng },
          radius: Math.min(radiusMeters, MAX_SEARCH_RADIUS_METERS),
        },
        includedTypes: ['electric_vehicle_charging_station'],
        maxResultCount: MAX_RESULTS,
        rankPreference: SearchNearbyRankPreference?.DISTANCE,
      }),
      SEARCH_TIMEOUT_MS,
      'Google Places did not respond. Check the browser console for Google Maps errors.',
    );
    places = response.places;
  } catch (error) {
    console.error('[searchNearbyEVStations] Places API (New) request failed', error);
    throw describePlacesError(error);
  }

  const createdAt = new Date().toISOString();

  return places
    .filter((place) => place.location)
    .map((place): EVStation => {
      const location = { lat: place.location!.lat(), lng: place.location!.lng() };
      const connectors = toConnectors(place, createdAt);
      const isOperational = !place.businessStatus || place.businessStatus === 'OPERATIONAL';

      return {
        id: place.id,
        name: place.displayName || 'EV charging station',
        location,
        address: place.formattedAddress || 'Address unavailable',
        rating: place.rating ?? 0,
        total_reviews: place.userRatingCount ?? 0,
        price_per_kwh: DEFAULT_PRICE_PER_KWH,
        available: isOperational && (connectors.length === 0 || connectors.some((c) => c.available)),
        connectors,
        // calculateDistance returns km; the UI expects metres.
        distance: calculateDistance(lat, lng, location.lat, location.lng) * 1000,
        isOpen: isOperational,
      };
    })
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
}

export type { SearchResult, SearchSuggestion } from '@/models/search.model';
